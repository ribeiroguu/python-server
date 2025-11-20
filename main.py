#!/usr/bin/env python3
"""
Servidor HTTP em Python para servir um build Vite (SPA) com fallback de rotas.

Características:
- Servidor multithread (ThreadingHTTPServer)
- Servir arquivos estáticos do diretório de build Vite (por padrão: ./dist)
- Fallback SPA: qualquer rota não encontrada cai em index.html
- Rota /health para verificação de status
- Encerramento gracioso via SIGINT/SIGTERM ou KeyboardInterrupt
- Cache agressivo para assets versionados (com hash no nome)
- Configurável via variáveis de ambiente

Variáveis de ambiente:
  SERVER_HOST        (default: 0.0.0.0)
  SERVER_PORT        (default: 9999)
  VITE_DIST_DIR      (default: dist)
  SERVER_LOG_LEVEL   (default: INFO)
  SPA_INDEX_FILE     (default: index.html)
  DISABLE_SPA_FALLBACK (default: false) -> se "true", retorna 404 em vez do fallback

Uso:
  python main.py
  SERVER_PORT=8080 VITE_DIST_DIR=frontend/dist python main.py
"""

from __future__ import annotations

import logging
import mimetypes
import os
import signal
import socket
import sys
import threading
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 9999
HOST = os.getenv("SERVER_HOST", DEFAULT_HOST)

_port_env = os.getenv("SERVER_PORT")
try:
    PORT = int(_port_env) if _port_env else DEFAULT_PORT
except ValueError:
    print(f"[WARN] SERVER_PORT inválida: {_port_env!r}. Usando {DEFAULT_PORT}.")
    PORT = DEFAULT_PORT

DIST_DIR = Path(os.getenv("VITE_DIST_DIR", "dist")).resolve()
INDEX_FILE_NAME = os.getenv("SPA_INDEX_FILE", "index.html")
DISABLE_SPA_FALLBACK = os.getenv("DISABLE_SPA_FALLBACK", "false").lower() in {"1", "true", "yes"}

LOG_LEVEL = os.getenv("SERVER_LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(threadName)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("vite-http-server")

# Pré-registro de alguns tipos comuns (mimetypes já tenta, reforçamos)
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("font/woff2", ".woff2")


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def is_hash_versioned(filename: str) -> bool:
    """
    Heurística simples para identificar arquivos versionados pelo Vite:
    Exemplos:
      - app.3a9f2d4e.js
      - style.ab12cd34.css
      - logo.8fd21.svg
    """
    stem = filename.rsplit("/", 1)[-1]
    parts = stem.split(".")
    if len(parts) < 3:
        return False
    # Ex: name.hash.ext => hash tem tamanho >= 6 e é alfanumérico
    hash_candidate = parts[-2]
    return len(hash_candidate) >= 6 and hash_candidate.isalnum()


def cache_headers_for(path: Path) -> tuple[str, str]:
    """
    Retorna (cache_control, etag) apropriados.
    Para assets com hash: cache longo (1 ano), senão cache curto.
    """
    if is_hash_versioned(path.name):
        return "public, max-age=31536000, immutable", f"W/{int(path.stat().st_mtime)}-{path.stat().st_size}"
    # HTML principal: não cachear agressivamente
    if path.suffix == ".html":
        return "no-cache", f"W/{int(path.stat().st_mtime)}-{path.stat().st_size}"
    return "public, max-age=3600", f"W/{int(path.stat().st_mtime)}-{path.stat().st_size}"


def read_file_bytes(path: Path) -> bytes:
    with path.open("rb") as f:
        return f.read()


def guess_content_type(path: Path) -> str:
    ctype, _ = mimetypes.guess_type(str(path))
    if not ctype:
        return "application/octet-stream"
    # Forçar charset em texto
    if ctype.startswith("text/") and "charset" not in ctype:
        ctype += "; charset=utf-8"
    return ctype


def ensure_dist_exists() -> None:
    if not DIST_DIR.exists() or not DIST_DIR.is_dir():
        logger.error("Diretório de build Vite não encontrado: %s", DIST_DIR)
        raise SystemExit(2)
    index_path = DIST_DIR / INDEX_FILE_NAME
    if not index_path.exists():
        logger.warning("Arquivo de index SPA (%s) não encontrado em %s", INDEX_FILE_NAME, DIST_DIR)


# ---------------------------------------------------------------------------
# Handler HTTP
# ---------------------------------------------------------------------------

class ViteStaticHandler(BaseHTTPRequestHandler):
    server_version = "VitePythonHTTP/1.0"
    sys_version = ""

    def do_HEAD(self) -> None:
        self._serve(method="HEAD")

    def do_GET(self) -> None:
        self._serve(method="GET")

    def log_message(self, format: str, *args) -> None:  # silencia log default
        logger.debug("%s - %s", self.address_string(), format % args)

    def _serve(self, method: str) -> None:
        path_requested = self.path.split("?", 1)[0]

        # Normalizar rota (ex: / -> /index.html para existe, mas usaremos fallback)
        logger.info("%s %s %s", method, path_requested, self.request_version)

        # Rota especial /health
        if path_requested == "/health":
            self._send_health(method)
            return

        # Remover prefixo inicial "/"
        rel = path_requested.lstrip("/")
        requested_file = (DIST_DIR / rel).resolve()

        # Bloquear escapes fora do diretório
        if not str(requested_file).startswith(str(DIST_DIR)):
            self._send_forbidden()
            return

        if requested_file.is_dir():
            # Se for diretório, tentar index.html dentro?
            potential = requested_file / "index.html"
            if potential.exists():
                requested_file = potential
            else:
                # Tratamento como inexistente -> fallback SPA
                requested_file = DIST_DIR / INDEX_FILE_NAME

        if requested_file.exists() and requested_file.is_file():
            self._send_file(method, requested_file)
            return

        # Fallback SPA (index.html) se habilitado
        if not DISABLE_SPA_FALLBACK:
            index_path = DIST_DIR / INDEX_FILE_NAME
            if index_path.exists():
                self._send_file(method, index_path, fallback=True, original_path=path_requested)
                return

        # 404 final
        self._send_not_found(path_requested)

    # -------------------------------------------------
    # Helpers de resposta
    # -------------------------------------------------

    def _send_health(self, method: str) -> None:
        content = b'{"status":"ok","service":"vite-static-server"}'
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        if method != "HEAD":
            self.wfile.write(content)

    def _send_file(self, method: str, path: Path, fallback: bool = False, original_path: str = "") -> None:
        try:
            data = read_file_bytes(path)
        except OSError as exc:
            logger.error("Erro lendo arquivo %s: %s", path, exc)
            self._send_internal_error()
            return

        ctype = guess_content_type(path)
        cache_control, etag = cache_headers_for(path)

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", cache_control)
        self.send_header("ETag", etag)
        if fallback:
            self.send_header("X-SPA-Fallback", original_path)
        self.end_headers()
        if method != "HEAD":
            try:
                self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError):
                logger.debug("Cliente fechou a conexão durante envio de %s", path.name)

    def _send_not_found(self, target: str) -> None:
        content = (
            "<!DOCTYPE html><html><head><meta charset='utf-8'><title>404</title>"
            "<style>body{font-family:sans-serif;padding:2rem;color:#333}</style>"
            "</head><body><h1>404 - Não encontrado</h1>"
            f"<p>Path solicitado: <code>{target}</code></p></body></html>"
        ).encode("utf-8")
        self.send_response(HTTPStatus.NOT_FOUND)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        try:
            self.wfile.write(content)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _send_forbidden(self) -> None:
        msg = b"Forbidden"
        self.send_response(HTTPStatus.FORBIDDEN)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(msg)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        try:
            self.wfile.write(msg)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _send_internal_error(self) -> None:
        msg = b"Internal Server Error"
        self.send_response(HTTPStatus.INTERNAL_SERVER_ERROR)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(msg)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        try:
            self.wfile.write(msg)
        except (BrokenPipeError, ConnectionResetError):
            pass


# ---------------------------------------------------------------------------
# Servidor com parada graciosa
# ---------------------------------------------------------------------------

class GracefulServer:
    def __init__(self, host: str, port: int, handler_cls=ViteStaticHandler):
        self._host = host
        self._port = port
        self._handler_cls = handler_cls
        self._httpd: Optional[ThreadingHTTPServer] = None
        self._shutdown_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        if self._httpd:
            raise RuntimeError("Servidor já iniciado.")
        ensure_dist_exists()
        self._httpd = ThreadingHTTPServer((self._host, self._port), self._handler_cls)
        self._httpd.daemon_threads = True
        logger.info("Servidor iniciado em http://%s:%d (dist=%s)", self._host, self._port, DIST_DIR)

        httpd = self._httpd
        assert httpd is not None

        def loop() -> None:
            while not self._shutdown_event.is_set():
                httpd.handle_request()
            logger.debug("Loop principal encerrado.")

        self._thread = threading.Thread(target=loop, name="HTTPMainLoop", daemon=True)
        self._thread.start()

    def stop(self, timeout: float = 5.0) -> None:
        if not self._httpd:
            return
        logger.info("Solicitando encerramento...")
        self._shutdown_event.set()
        self._poke()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=timeout)
        self._httpd.server_close()
        logger.info("Servidor encerrado.")

    def _poke(self) -> None:
        try:
            with socket.create_connection((self._host, self._port), timeout=1):
                pass
        except OSError:
            pass


_server_instance: Optional[GracefulServer] = None


def _signal_handler(signum: int, frame) -> None:  # type: ignore[override]
    sig_name = signal.Signals(signum).name
    logger.info("Sinal recebido: %s. Encerrando...", sig_name)
    global _server_instance
    if _server_instance:
        _server_instance.stop()
    sys.exit(0)


def configure_signals() -> None:
    for s in (signal.SIGINT, signal.SIGTERM):
        signal.signal(s, _signal_handler)


def run() -> None:
    global _server_instance
    _server_instance = GracefulServer(HOST, PORT)
    _server_instance.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt recebido.")
    finally:
        _server_instance.stop()


if __name__ == "__main__":
    configure_signals()
    run()

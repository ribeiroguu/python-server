export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-black sm:text-3xl lg:text-4xl">
            📚 Calculadora do Aluno
          </h1>
          <p className="text-sm text-gray-500 sm:text-base">
            Planeje seu sucesso acadêmico
          </p>
        </div>
      </div>
    </header>
  )
}

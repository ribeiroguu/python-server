import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { DisciplineData } from '@/types'

interface AttendanceCardProps {
  data: DisciplineData
}

export default function AttendanceCard({ data }: AttendanceCardProps) {
  // Cálculo de faltas permitidas
  const maxAbsencesAllowed = Math.floor(
    (data.totalClasses * data.maxAbsencePercentage) / 100
  )
  
  // Cálculo do progresso em percentual
  const progressPercentage = (data.currentAbsences / maxAbsencesAllowed) * 100
  
  // Quantas faltas ainda pode ter
  const remainingAbsences = Math.max(0, maxAbsencesAllowed - data.currentAbsences)
  
  // Faltas em excesso
  const excessAbsences = Math.max(0, data.currentAbsences - maxAbsencesAllowed)

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-black">
          <span>📅</span>
          <span>Frequência</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Faltas Atuais */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-gray-500">Faltas Atuais</p>
            <p className="text-3xl font-bold text-black">
              {data.currentAbsences}
              <span className="text-lg text-gray-500"> / {maxAbsencesAllowed}</span>
            </p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Informações adicionais */}
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Total de Aulas</p>
            <p className="text-sm font-semibold text-black">{data.totalClasses}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Pode Faltar Mais</p>
            <p className="text-sm font-semibold text-green-600">
              {remainingAbsences} {remainingAbsences === 1 ? 'aula' : 'aulas'}
            </p>
          </div>
          {excessAbsences > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Faltas em Excesso</p>
              <p className="text-sm font-semibold text-red-600">
                {excessAbsences} {excessAbsences === 1 ? 'falta' : 'faltas'}
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 ${
            excessAbsences > 0
              ? 'border-red-200 bg-red-50'
              : remainingAbsences <= 3
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-green-200 bg-green-50'
          }`}
        >
          <span className="text-lg">
            {excessAbsences > 0 ? '⚠️' : remainingAbsences <= 3 ? '⚡' : '✓'}
          </span>
          <p
            className={`text-sm font-medium ${
              excessAbsences > 0
                ? 'text-red-700'
                : remainingAbsences <= 3
                ? 'text-yellow-700'
                : 'text-green-700'
            }`}
          >
            {excessAbsences > 0
              ? 'Situação: Reprovado por falta'
              : remainingAbsences <= 3
              ? 'Situação: Atenção necessária'
              : 'Situação: Frequência segura'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

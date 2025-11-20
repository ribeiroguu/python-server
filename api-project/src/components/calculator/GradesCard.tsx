import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { DisciplineData } from '@/types'

interface GradesCardProps {
  data: DisciplineData
}

export default function GradesCard({ data }: GradesCardProps) {
  // Cálculo do progresso em percentual
  const progressPercentage = (data.currentGrade / data.maxGrade) * 100

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-black">
          <span>📊</span>
          <span>Notas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nota Atual */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-gray-500">Nota Atual</p>
            <p className="text-3xl font-bold text-black">
              {data.currentGrade.toFixed(1)}
              <span className="text-lg text-gray-500"> / {data.maxGrade.toFixed(1)}</span>
            </p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Informações adicionais */}
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Nota Mínima</p>
            <p className="text-sm font-semibold text-black">{data.minGrade.toFixed(1)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">% Avaliado</p>
            <p className="text-sm font-semibold text-black">{data.evaluatedPercentage}%</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
          <span className="text-lg">✓</span>
          <p className="text-sm font-medium text-green-700">
            {data.currentGrade >= data.minGrade
              ? 'Situação: Aprovado até o momento'
              : 'Situação: Precisa melhorar'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

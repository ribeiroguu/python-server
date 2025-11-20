import GradesCard from './GradesCard'
import AttendanceCard from './AttendanceCard'
import type { DisciplineData } from '@/types'

interface ResultsDisplayProps {
  data: DisciplineData | null
}

export default function ResultsDisplay({ data }: ResultsDisplayProps) {
  if (!data) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
        <p className="text-center text-gray-500">
          Preencha o formulário acima para visualizar os resultados
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GradesCard data={data} />
      <AttendanceCard data={data} />
    </div>
  )
}

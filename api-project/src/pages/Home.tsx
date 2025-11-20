import { useState } from 'react'
import Header from '@/components/layout/Header'
import Container from '@/components/layout/Container'
import CalculatorForm from '@/components/calculator/CalculatorForm'
import ResultsDisplay from '@/components/calculator/ResultsDisplay'
import type { DisciplineData } from '@/types'

export default function Home() {
  const [calculatedData, setCalculatedData] = useState<DisciplineData | null>(null)

  const handleFormSubmit = (data: DisciplineData) => {
    setCalculatedData(data)
  }

  const handleReset = () => {
    setCalculatedData(null)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Container>
        <div className="space-y-8">
          {/* Formulário */}
          <CalculatorForm onSubmit={handleFormSubmit} onReset={handleReset} />
          
          {/* Resultados */}
          <ResultsDisplay data={calculatedData} />
        </div>
      </Container>
    </div>
  )
}

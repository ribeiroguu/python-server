import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DisciplineData } from '@/types'

interface CalculatorFormProps {
  onSubmit: (data: DisciplineData) => void
  onReset?: () => void
}

export default function CalculatorForm({ onSubmit, onReset }: CalculatorFormProps) {
  const initialFormData: DisciplineData = {
    name: '',
    professor: '',
    minGrade: 7,
    maxGrade: 10,
    currentGrade: 0,
    evaluatedPercentage: 0,
    totalClasses: 80,
    maxAbsencePercentage: 25,
    currentAbsences: 0,
  }

  const [formData, setFormData] = useState<DisciplineData>(initialFormData)

  const handleInputChange = (field: keyof DisciplineData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'name' || field === 'professor' ? value : Number(value) || 0,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleReset = () => {
    setFormData(initialFormData)
    if (onReset) {
      onReset()
    }
  }

  return (
    <Card className='w-full shadow-sm'>
      <CardHeader>
        <CardTitle className='text-xl font-bold text-black'>Informações da Disciplina</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Informações da Disciplina */}
          <div className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='name' className='text-sm font-medium text-black'>
                  Nome da Disciplina
                </Label>
                <Input
                  id='name'
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder='Ex: Cálculo I'
                  className='border-gray-200 focus-visible:ring-green-500'
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='professor' className='text-sm font-medium text-black'>
                  Nome do Professor
                </Label>
                <Input
                  id='professor'
                  type='text'
                  value={formData.professor}
                  onChange={(e) => handleInputChange('professor', e.target.value)}
                  placeholder='Ex: João Silva'
                  className='border-gray-200 focus-visible:ring-green-500'
                  required
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-black'>Notas</h3>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <div className='space-y-2'>
                <Label htmlFor='minGrade' className='text-sm font-medium text-black'>
                  Nota Mínima
                </Label>
                <Input
                  id='minGrade'
                  type='number'
                  step='0.1'
                  value={formData.minGrade}
                  onChange={(e) => handleInputChange('minGrade', e.target.value)}
                  className='border-gray-200 focus-visible:ring-green-500'
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='maxGrade' className='text-sm font-medium text-black'>
                  Nota Máxima
                </Label>
                <Input
                  id='maxGrade'
                  type='number'
                  step='0.1'
                  value={formData.maxGrade}
                  onChange={(e) => handleInputChange('maxGrade', e.target.value)}
                  className='border-gray-200 focus-visible:ring-green-500'
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='currentGrade' className='text-sm font-medium text-black'>
                  Nota Atual
                </Label>
                <Input
                  id='currentGrade'
                  type='number'
                  step='0.1'
                  value={formData.currentGrade}
                  onChange={(e) => handleInputChange('currentGrade', e.target.value)}
                  className='border-gray-200 focus-visible:ring-green-500'
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='evaluatedPercentage' className='text-sm font-medium text-black'>
                  % Avaliado
                </Label>
                <Input
                  id='evaluatedPercentage'
                  type='number'
                  step='1'
                  min='0'
                  max='100'
                  value={formData.evaluatedPercentage}
                  onChange={(e) => handleInputChange('evaluatedPercentage', e.target.value)}
                  className='border-gray-200 focus-visible:ring-green-500'
                  required
                />
              </div>
            </div>
          </div>

          {/* Frequência */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-black'>Frequência</h3>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <div className='space-y-2'>
                <Label htmlFor='totalClasses' className='text-sm font-medium text-black'>
                  Total de Aulas
                </Label>
                <Input
                  id='totalClasses'
                  type='number'
                  value={formData.totalClasses}
                  onChange={(e) => handleInputChange('totalClasses', e.target.value)}
                  className='border-gray-200 focus-visible:ring-green-500'
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='maxAbsencePercentage' className='text-sm font-medium text-black'>
                  % Máximo de Faltas
                </Label>
                <Input
                  id='maxAbsencePercentage'
                  type='number'
                  step='1'
                  min='0'
                  max='100'
                  value={formData.maxAbsencePercentage}
                  onChange={(e) => handleInputChange('maxAbsencePercentage', e.target.value)}
                  className='border-gray-200 focus-visible:ring-green-500'
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='currentAbsences' className='text-sm font-medium text-black'>
                  Faltas Atuais
                </Label>
                <Input
                  id='currentAbsences'
                  type='number'
                  value={formData.currentAbsences}
                  onChange={(e) => handleInputChange('currentAbsences', e.target.value)}
                  className='border-gray-200 focus-visible:ring-green-500'
                  required
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className='flex flex-col gap-3 sm:flex-row sm:gap-4'>
            <Button
              type='submit'
              className='w-full bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500 sm:w-auto sm:px-8'
            >
              Calcular
            </Button>
            <Button
              type='button'
              onClick={handleReset}
              variant='outline'
              className='w-full text-white hover:bg-destructive focus-visible:ring-destructive bg-destructive sm:w-auto sm:px-8'
            >
              Resetar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

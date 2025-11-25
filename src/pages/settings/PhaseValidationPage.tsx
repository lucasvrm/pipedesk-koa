import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import PhaseValidationManager from '@/components/PhaseValidationManager'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'

export default function PhaseValidationPage() {
  const navigate = useNavigate()
  const { profile: currentUser } = useAuth()

  if (!currentUser) return null

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Validação de Fases</h1>
          <p className="text-muted-foreground">Regras de transição entre etapas do funil</p>
        </div>
      </div>
      
      <PhaseValidationManager currentUser={currentUser} />
    </div>
  )
}
import { useNavigate } from 'react-router-dom'
import HelpCenter from '@/components/HelpCenter'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'

export default function HelpCenterPage() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Central de Ajuda</h1>
          <p className="text-muted-foreground">Documentação e suporte</p>
        </div>
      </div>
      
      <HelpCenter />
    </div>
  )
}
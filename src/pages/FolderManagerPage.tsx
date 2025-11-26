import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import FolderManager from '@/components/FolderManager'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'

export default function FolderManagerPage() {
  const navigate = useNavigate()
  const { profile: currentUser } = useAuth()

  if (!currentUser) return null

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/folders')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Pastas</h1>
          <p className="text-muted-foreground">Estrutura de arquivos e organização</p>
        </div>
      </div>
      
      <FolderManager currentUser={currentUser} />
    </div>
  )
}
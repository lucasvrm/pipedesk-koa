import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import CustomFieldsManager from '@/components/CustomFieldsManager'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'
import { PageContainer } from '@/components/PageContainer'

export default function CustomFieldsPage() {
  const navigate = useNavigate()
  const { profile: currentUser } = useAuth()

  if (!currentUser) return null

  return (
    <PageContainer>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Campos Customizados</h1>
          <p className="text-muted-foreground">Gerencie campos extras para Negócios, Tracks e Tarefas</p>
        </div>
      </div>
      
      <CustomFieldsManager
        currentUser={currentUser}
        open={true}
        onOpenChange={() => {}}
      />
    </PageContainer>
  )
}

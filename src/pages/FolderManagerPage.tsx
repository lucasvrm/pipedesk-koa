import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import FolderManager from '@/components/FolderManager'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'
import { StandardPageLayout } from '@/components/layouts'

export default function FolderManagerPage() {
  const navigate = useNavigate()
  const { profile: currentUser } = useAuth()

  if (!currentUser) return null

  // FolderManager espera props de modal, mas aqui é uma página.
  // Passamos props fictícios para satisfazer a interface se ele for usado como Dialog,
  // ou ele deveria ser refatorado para suportar modo "embedded".
  // Assumindo que FolderManager pode precisar de refatoração interna se for estritamente um Dialog.
  // Mas para corrigir o erro de tipo imediato:

  return (
    <StandardPageLayout>
      <FolderManager
        currentUser={currentUser}
        open={true}
        onOpenChange={() => {}}
      />
    </StandardPageLayout>
  )
}

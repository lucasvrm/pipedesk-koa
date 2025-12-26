import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import CustomFieldsManager from '@/components/CustomFieldsManager'
import { StandardPageLayout } from '@/components/layouts'

export default function CustomFieldsPage() {
  const navigate = useNavigate()
  const { profile: currentUser } = useAuth()

  if (!currentUser) return null

  return (
    <StandardPageLayout>
      <CustomFieldsManager
        currentUser={currentUser}
        open={true}
        onOpenChange={() => {}}
      />
    </StandardPageLayout>
  )
}

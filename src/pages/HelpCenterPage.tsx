import { useNavigate } from 'react-router-dom'
import HelpCenter from '@/components/HelpCenter'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'
import { StandardPageLayout } from '@/components/layouts'

export default function HelpCenterPage() {
  const navigate = useNavigate()

  return (
    <StandardPageLayout>
      <HelpCenter />
    </StandardPageLayout>
  )
}
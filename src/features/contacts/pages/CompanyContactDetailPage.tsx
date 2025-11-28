import { useNavigate, useParams } from 'react-router-dom'
import { useCompanyContact } from '@/services/companyService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Envelope, Phone, User, Buildings, Briefcase } from '@phosphor-icons/react'
import { getInitials } from '@/lib/helpers'

export default function CompanyContactDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: contact, isLoading } = useCompanyContact(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Contato não encontrado</h2>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="flex items-start gap-6 mb-8">
        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {getInitials(contact.name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1 mt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{contact.name}</h1>
            {contact.isPrimary && (
              <Badge variant="default">Contato Principal</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-lg text-muted-foreground">
            <Buildings className="h-5 w-5" />
            <span className="font-medium">{contact.companyName || 'Empresa desconhecida'}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" /> Cargo
                </span>
                <p className="text-base">{contact.role || '-'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Envelope className="h-3.5 w-3.5" /> Email
                </span>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="text-base text-primary hover:underline">
                    {contact.email}
                  </a>
                ) : <p>-</p>}
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Telefone
                </span>
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="text-base hover:text-primary transition-colors">
                    {contact.phone}
                  </a>
                ) : <p>-</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Deal } from '@/lib/types' // Certifique-se que o tipo existe
import { formatCurrency } from '@/lib/utils' // Ou sua função de formatação existente
import { Calendar, User, Money, Tag, Clock } from '@phosphor-icons/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface DealPreviewSheetProps {
  deal: Deal | null
  isOpen: boolean
  onClose: () => void
  onEdit: (deal: Deal) => void
}

export function DealPreviewSheet({ deal, isOpen, onClose, onEdit }: DealPreviewSheetProps) {
  if (!deal) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={deal.status === 'active' ? 'default' : 'secondary'}>
              {deal.stage.toUpperCase()}
            </Badge>
            {/* Exemplo de tag de "Rotting" se tiver lógica para isso */}
            {new Date(deal.updated_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                <Badge variant="destructive" className="flex gap-1 items-center">
                    <Clock size={12} /> Estagnado
                </Badge>
            )}
          </div>
          <SheetTitle className="text-2xl">{deal.title}</SheetTitle>
          <SheetDescription>
            Criado em {new Date(deal.created_at).toLocaleDateString()}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
            {/* Valor e Probabilidade */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase">Valor Potencial</Label>
                    <div className="flex items-center gap-2 text-xl font-bold text-emerald-600">
                        <Money size={24} />
                        {formatCurrency(deal.value)}
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase">Responsável</Label>
                    <div className="flex items-center gap-2">
                         <Avatar className="h-8 w-8">
                            <AvatarFallback>U</AvatarFallback> {/* Adicionar lógica de iniciais */}
                         </Avatar>
                         <span className="text-sm font-medium">Você</span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="details">
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="details">Detalhes Rápidos</TabsTrigger>
                    <TabsTrigger value="notes">Notas</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Empresa / Cliente</Label>
                        <Input value={deal.company_name || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                         <Label>Próximo Passo</Label>
                         <Input placeholder="Definir próximo passo..." />
                    </div>
                    {/* Aqui você pode adicionar campos editáveis rápidos */}
                </TabsContent>
                <TabsContent value="notes">
                    <div className="h-32 flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg">
                        Área de Notas Rápidas (Implementar componente de comentários)
                    </div>
                </TabsContent>
            </Tabs>
        </div>

        <SheetFooter>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
            <Button onClick={() => {
                onClose()
                // Navegar para a página completa
                window.location.href = `/deals/${deal.id}`
            }}>Ver Detalhes Completos</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
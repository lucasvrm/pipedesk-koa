import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { TimelineItem } from './types'

interface EditCommentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  comment: TimelineItem | null
  onSave: (commentId: string, content: string) => Promise<void>
  isSaving?: boolean
}

export function EditCommentModal({
  open,
  onOpenChange,
  comment,
  onSave,
  isSaving = false
}: EditCommentModalProps) {
  const [content, setContent] = useState('')

  // Inicializar com comment.content quando modal abre
  useEffect(() => {
    if (open && comment) {
      setContent(comment.content)
    }
  }, [open, comment])

  const handleSave = async () => {
    if (!comment || !content.trim()) return
    await onSave(comment.id, content.trim())
  }

  // Botão Salvar desabilitado se conteúdo vazio ou igual ao original
  const isSaveDisabled =
    isSaving ||
    !content.trim() ||
    content.trim() === comment?.content

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Comentário</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite seu comentário..."
            className="min-h-[120px] resize-none"
            disabled={isSaving}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaveDisabled}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

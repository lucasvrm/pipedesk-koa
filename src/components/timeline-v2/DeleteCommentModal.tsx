import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog'
import type { TimelineItem } from './types'

interface DeleteCommentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  comment: TimelineItem | null
  onConfirm: (commentId: string) => Promise<void>
  isDeleting?: boolean
}

export function DeleteCommentModal({
  open,
  onOpenChange,
  comment,
  onConfirm,
  isDeleting = false
}: DeleteCommentModalProps) {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!comment) return
    await onConfirm(comment.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Excluir Comentário
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Tem certeza que deseja excluir este comentário?
            </span>
            <span className="block text-muted-foreground">
              Esta ação não pode ser desfeita.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

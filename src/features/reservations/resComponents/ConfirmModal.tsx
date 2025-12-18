import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/Dialog"
import { Button } from "../../../components/ui/Button"

interface ConfirmModalProps {
  open: boolean
  title: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  loading?: boolean
  error?: string | null
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  error = null,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(state) => (!state ? onClose() : null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-700">{message}</div>

          {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {cancelText}
            </Button>
            <Button onClick={onConfirm} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


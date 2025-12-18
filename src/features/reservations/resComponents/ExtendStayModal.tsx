import { useEffect, useMemo, useState } from "react"
import type { reservation } from "../types/reservations"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/Dialog"
import { Button } from "../../../components/ui/Button"
import { Label } from "../../../components/ui/Label"
import { Input } from "../../../components/ui/Input"
import { Loader2 } from "lucide-react"

interface ExtendStayModalProps {
  open: boolean
  onClose: () => void
  reservation: reservation | null
  onSuccess: (reservationId: number, newCheckOut: Date) => Promise<{ ok: boolean; message?: string }>
}

const formatDateTimeLocal = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

const formatDisplay = (date: Date) =>
  date.toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

const parseLocalDateTimeInput = (value: string): Date | null => {
  if (!value) return null
  const [datePart, timePart] = value.split("T")
  if (!datePart || !timePart) return null
  const [year, month, day] = datePart.split("-").map((part) => Number.parseInt(part, 10))
  const [hour, minute] = timePart.split(":").map((part) => Number.parseInt(part, 10))
  if ([year, month, day, hour, minute].some((num) => Number.isNaN(num))) return null
  return new Date(year, month - 1, day, hour, minute)
}

export function ExtendStayModal({ open, onClose, reservation, onSuccess }: ExtendStayModalProps) {
  const [newCheckOut, setNewCheckOut] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && reservation) {
      setNewCheckOut(formatDateTimeLocal(reservation.checkOut))
      setErrorMsg(null)
      setIsSubmitting(false)
    }
  }, [open, reservation])

  const isInvalid = useMemo(() => {
    if (!reservation) return true
    const parsed = parseLocalDateTimeInput(newCheckOut)
    if (!parsed) return true
    return parsed.getTime() <= reservation.checkOut.getTime()
  }, [reservation, newCheckOut])

  const handleConfirm = async () => {
    if (!reservation) return
    const parsed = parseLocalDateTimeInput(newCheckOut)
    if (!parsed) {
      setErrorMsg("Formato inválido. Usa YYYY-MM-DD HH:MM")
      return
    }
    if (parsed.getTime() <= reservation.checkOut.getTime()) {
      setErrorMsg("El nuevo check-out debe ser posterior al actual")
      return
    }
    setErrorMsg(null)
    setIsSubmitting(true)
    const result = await onSuccess(reservation.id, parsed)
    setIsSubmitting(false)
    if (result.ok) {
      onClose()
    } else {
      setErrorMsg(result.message || "No se pudo extender la estadía")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(state) => (!state ? onClose() : null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extender estadía</DialogTitle>
        </DialogHeader>
        {reservation && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground space-y-1">
              <p>Check-in: {formatDisplay(reservation.checkIn)}</p>
              <p>Check-out actual: {formatDisplay(reservation.checkOut)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="extend-new-checkout">Nuevo check-out</Label>
              <Input
                id="extend-new-checkout"
                type="datetime-local"
                value={newCheckOut}
                min={formatDateTimeLocal(reservation.checkOut)}
                onChange={(event) => setNewCheckOut(event.target.value)}
              />
            </div>
            {errorMsg && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={isInvalid || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

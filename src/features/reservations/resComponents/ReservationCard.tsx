import type { reservation } from "../types/reservations"
import { Card, CardContent } from "../../../components/ui/Card"
import { Badge } from "../../../components/ui/Badge"
import { Button } from "../../../components/ui/Button"
import { Users, Edit, Trash2, Bed, Eye, LogIn, LogOut, Sparkles, Clock } from "lucide-react"
import { useState } from "react"
import { ResDetailsModal } from "./ResDetailsModal"
import { ConfirmModal } from "./ConfirmModal"
import { cleanBedsByNumbers } from "../services/reservationService"

type ReservationCardOperativeProps = {
  reservation: reservation
  formatDate: (date: Date) => string
  onEdit: (reservation: reservation) => void
  onDelete: (id: number) => void
  onCheckIn: (id: number) => Promise<void>
  onCheckOut: (id: number) => Promise<void>
  onExtend: (reservation: reservation) => void
  readOnly?: false
}

type ReservationCardReadOnlyProps = {
  reservation: reservation
  formatDate: (date: Date) => string
  readOnly: true
  onEdit?: undefined
  onDelete?: undefined
  onCheckIn?: undefined
  onCheckOut?: undefined
  onExtend?: undefined
}

type ReservationCardProps = ReservationCardOperativeProps | ReservationCardReadOnlyProps
export function ReservationCard({ 
  reservation, 
  formatDate, 
  onEdit,
  onDelete,
  onCheckIn,
  onCheckOut,
  onExtend,
  readOnly = false,
}: ReservationCardProps) {
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCheckInConfirmOpen, setIsCheckInConfirmOpen] = useState(false)
  const [isCheckInSubmitting, setIsCheckInSubmitting] = useState(false)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [checkInNow, setCheckInNow] = useState<Date | null>(null)
  const [isCheckOutConfirmOpen, setIsCheckOutConfirmOpen] = useState(false)
  const [isCheckOutSubmitting, setIsCheckOutSubmitting] = useState(false)
  const [checkOutError, setCheckOutError] = useState<string | null>(null)
  const [checkOutNow, setCheckOutNow] = useState<Date | null>(null)
  const [isCleanBedsConfirmOpen, setIsCleanBedsConfirmOpen] = useState(false)
  const [isCleanBedsSubmitting, setIsCleanBedsSubmitting] = useState(false)
  const [cleanBedsError, setCleanBedsError] = useState<string | null>(null)

  const getStatusText = (status: string) => {
    switch (status) {
      case "activa":
        return "Activa"
      case "en_progreso":
        return "Activa"
      case "completada":
        return "Completada"
      case "cancelada":
        return "Cancelada"
      default:
        return status
    }
  }

  const getGuestNamesDisplay = () => {
    const names = reservation.guestDetails.map(g => `${g.name} ${g.lastName}`)
    
    if (names.length <= 2) {
      return names.join(", ")
    }
    
    const remaining = names.length - 2
    return `${names[0]}, ${names[1]} y ${remaining} más`
  }
  const bedNumbers = reservation.guestDetails
    .map(g => g.bedNumber)
    .filter(bed => bed !== null)
    .join(", ")
     // Determina qué botones mostrar según el estado
  const showCheckIn = !reservation.realCheckInDateTime
  const showCheckOut = !!reservation.realCheckInDateTime && reservation.status !== 'completada'
  const canCheckOut = reservation.realCheckInDateTime
    ? Date.now() >= (reservation.realCheckInDateTime.getTime() + 60 * 60 * 1000)
    : false
  const checkOutTitle = showCheckOut && !canCheckOut
    ? `Disponible desde ${(reservation.realCheckInDateTime ? new Date(reservation.realCheckInDateTime.getTime() + 60*60*1000) : reservation.checkOut).toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'})}`
    : undefined

  const openCleanBedsConfirm = () => {
    if (readOnly) return
    setCleanBedsError(null)
    setIsCleanBedsConfirmOpen(true)
  }

  const handleConfirmCleanBeds = async () => {
    if (readOnly) return
    setIsCleanBedsSubmitting(true)
    setCleanBedsError(null)
    const beds = reservation.guestDetails
      .map(g => g.bedNumber)
      .filter((n): n is number => typeof n === 'number')
    if (beds.length === 0) {
      setIsCleanBedsSubmitting(false)
      setIsCleanBedsConfirmOpen(false)
      return
    }
    try {
      await cleanBedsByNumbers(beds)
      try { window.dispatchEvent(new Event('beds:reload')) } catch (e) { console.warn('Failed to dispatch beds:reload', e) }
      setIsCleanBedsConfirmOpen(false)
    } catch (error) {
      const msg =
        (error as any)?.message ||
        (typeof error === "string" ? error : null) ||
        "No se pudieron marcar las camas como limpias. Intenta nuevamente."
      setCleanBedsError(msg)
    } finally {
      setIsCleanBedsSubmitting(false)
    }
  }

  const openCheckInConfirm = () => {
    if (readOnly) return
    setCheckInNow(new Date())
    setCheckInError(null)
    setIsCheckInConfirmOpen(true)
  }

  const openCheckOutConfirm = () => {
    if (readOnly) return
    setCheckOutNow(new Date())
    setCheckOutError(null)
    setIsCheckOutConfirmOpen(true)
  }

  const handleConfirmCheckIn = async () => {
    if (readOnly) return
    if (!onCheckIn) return
    setIsCheckInSubmitting(true)
    setCheckInError(null)
    try {
      await onCheckIn(reservation.id)
      setIsCheckInConfirmOpen(false)
    } catch (error) {
      const msg =
        (error as any)?.message ||
        (typeof error === "string" ? error : null) ||
        "No se pudo realizar el check-in. Intenta nuevamente."
      setCheckInError(msg)
    } finally {
      setIsCheckInSubmitting(false)
    }
  }

  const handleConfirmCheckOut = async () => {
    if (readOnly) return
    if (!onCheckOut) return
    setIsCheckOutSubmitting(true)
    setCheckOutError(null)
    try {
      await onCheckOut(reservation.id)
      setIsCheckOutConfirmOpen(false)
    } catch (error) {
      const msg =
        (error as any)?.message ||
        (typeof error === "string" ? error : null) ||
        "No se pudo realizar el check-out. Intenta nuevamente."
      setCheckOutError(msg)
    } finally {
      setIsCheckOutSubmitting(false)
    }
  }

  return (
<>
      <Card className="hover:shadow-lg transition-all">
        <CardContent className="p-5">
          <div className="space-y-3">
            {/* Header con nombres, estado y botones pequeños */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{getGuestNamesDisplay()}</h3>
                  <Badge variant={reservation.status === "activa" ? "default" : "secondary"}>
                    {getStatusText(reservation.status)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  📅 {formatDate(reservation.checkIn)} - {formatDate(reservation.checkOut)}
                </p>
              </div>

              {/* Botones pequeños arriba a la derecha */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailsOpen(true)}
                  className="h-8 px-2 text-xs"
                  title="Ver detalles"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Detalles
                </Button>
                {!readOnly && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(reservation)}
                      className="h-8 px-2 text-xs hover:bg-blue-50"
                      title="Editar reserva"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(reservation.id)}
                      className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      title="Eliminar reserva"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Info rápida: personas y camas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {reservation.guests} {reservation.guests === 1 ? "persona" : "personas"}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  Camas: {bedNumbers}
                </Badge>
              </div>

              {/* Botones CHECK IN / CHECK OUT */}
              <div className="flex gap-2">
                {!readOnly && showCheckIn && (
                  <Button
                    onClick={openCheckInConfirm}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    CHECK IN
                  </Button>
                )}
                {!readOnly && showCheckOut && (
                  <Button
                    onClick={openCheckOutConfirm}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                    disabled={!canCheckOut}
                    title={checkOutTitle}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    CHECK OUT
                  </Button>
                )}
                {!readOnly && (reservation.status === 'activa' || reservation.status === 'en_progreso') && (
                  <Button
                    onClick={() => onExtend?.(reservation)}
                    variant="outline"
                    size="sm"
                    title="Extender estancia"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Extender
                  </Button>
                )}
                {!readOnly && reservation.status === 'completada' && (
                  <Button
                    onClick={openCleanBedsConfirm}
                    variant="outline"
                    size="sm"
                    title="Marcar todas las camas de esta reserva como limpias"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Limpiar camas
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      <ResDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        reservation={reservation}
        formatDate={formatDate}
      />

      {!readOnly && (
        <>
          <ConfirmModal
            open={isCheckInConfirmOpen}
            title="Confirmar check-in"
            message={
              <div className="space-y-3">
                <p>¿Confirmar check-in para esta reserva?</p>
                <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Cliente:</span> {getGuestNamesDisplay()}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Cama(s):</span> {bedNumbers || "Sin asignar"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Check-in planificado:</span>{" "}
                    {reservation.checkIn.toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Hora actual:</span>{" "}
                    {(checkInNow ?? new Date()).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            }
            cancelText="Cancelar"
            confirmText="Confirmar"
            loading={isCheckInSubmitting}
            error={checkInError}
            onClose={() => (!isCheckInSubmitting ? setIsCheckInConfirmOpen(false) : null)}
            onConfirm={handleConfirmCheckIn}
          />

          <ConfirmModal
            open={isCheckOutConfirmOpen}
            title="Confirmar check-out"
            message={
              <div className="space-y-3">
                {(() => {
                  const now = checkOutNow ?? new Date()
                  const scheduledOut = reservation.checkOut
                  const isEarly = now.getTime() < scheduledOut.getTime()
                  const minsEarly = isEarly
                    ? Math.max(0, Math.round((scheduledOut.getTime() - now.getTime()) / 60000))
                    : 0
                  return isEarly ? (
                    <p>{`Estás adelantando el check-out ${minsEarly} min antes de lo programado. ¿Deseas continuar?`}</p>
                  ) : (
                    <p>¿Confirmar check-out para esta reserva?</p>
                  )
                })()}

                <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Cliente:</span> {getGuestNamesDisplay()}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Cama(s):</span> {bedNumbers || "Sin asignar"}
                  </p>
                  {reservation.realCheckInDateTime && (
                    <p>
                      <span className="font-medium text-foreground">Check-in real:</span>{" "}
                      {reservation.realCheckInDateTime.toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-foreground">Check-out planificado:</span>{" "}
                    {reservation.checkOut.toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Hora actual:</span>{" "}
                    {(checkOutNow ?? new Date()).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            }
            cancelText="Cancelar"
            confirmText="Confirmar"
            loading={isCheckOutSubmitting}
            error={checkOutError}
            onClose={() => (!isCheckOutSubmitting ? setIsCheckOutConfirmOpen(false) : null)}
            onConfirm={handleConfirmCheckOut}
          />

          <ConfirmModal
            open={isCleanBedsConfirmOpen}
            title="Marcar camas como limpias"
            message={
              <div className="space-y-2">
                <p>¿Marcar como limpias todas las camas de esta reserva?</p>
                <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Cama(s):</span> {bedNumbers || "Sin asignar"}
                  </p>
                </div>
              </div>
            }
            cancelText="Cancelar"
            confirmText="Confirmar"
            loading={isCleanBedsSubmitting}
            error={cleanBedsError}
            onClose={() => (!isCleanBedsSubmitting ? setIsCleanBedsConfirmOpen(false) : null)}
            onConfirm={handleConfirmCleanBeds}
          />
        </>
      )}
    </>
  )

}

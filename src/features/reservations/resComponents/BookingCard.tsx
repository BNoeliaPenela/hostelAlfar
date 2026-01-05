import { useMemo, useState } from "react"
import type { reservation } from "../types/reservations"
import { Card, CardContent } from "../../../components/ui/Card"
import { Button } from "../../../components/ui/Button"
import { ResDetailsModal } from "./ResDetailsModal"
import { ConfirmModal } from "./ConfirmModal"

type BookingCardOperativeProps = {
  reservation: reservation
  formatDate: (date: Date) => string
  onCancel: (id: number) => void | Promise<void>
  onCheckIn: (id: number) => Promise<void>
  onCheckOut: (id: number) => Promise<void>
  readOnly?: false
}

type BookingCardReadOnlyProps = {
  reservation: reservation
  formatDate: (date: Date) => string
  readOnly: true
  onCancel?: undefined
  onCheckIn?: undefined
  onCheckOut?: undefined
}

export type BookingCardProps = BookingCardOperativeProps | BookingCardReadOnlyProps

type BookingUiStatus = "Confirmada" | "Pendiente" | "Check-in" | "Completada" | "Cancelada"

function getGuestNamesDisplay(reservation: reservation) {
  const names = reservation.guestDetails.map((g) => `${g.name} ${g.lastName}`.trim()).filter(Boolean)
  if (names.length <= 2) return names.join(", ")
  const remaining = names.length - 2
  return `${names[0]}, ${names[1]} y ${remaining} más`
}

function getBedLabel(reservation: reservation) {
  const beds = reservation.guestDetails
    .map((g) => g.bedNumber)
    .filter((n): n is number => typeof n === "number")
    .sort((a, b) => a - b)

  if (beds.length === 0) return "Sin asignar"
  if (beds.length === 1) return `Cápsula #${beds[0]}`
  return `Cápsulas #${beds.join(", #")}`
}

function getUiStatus(reservation: reservation): BookingUiStatus {
  if (reservation.status === "cancelada") return "Cancelada"
  if (reservation.status === "completada") return "Completada"

  const isCheckedIn = Boolean(reservation.realCheckInDateTime) || reservation.status === "en_progreso" || reservation.status === "ocupada"
  if (isCheckedIn) return "Check-in"

  const checkInTs = reservation.checkIn instanceof Date ? reservation.checkIn.getTime() : NaN
  if (!Number.isFinite(checkInTs)) return "Confirmada"
  return checkInTs <= Date.now() ? "Pendiente" : "Confirmada"
}

function getBadgeStyles(status: BookingUiStatus) {
  switch (status) {
    case "Confirmada":
      return "bg-[#28a745] text-white"
    case "Pendiente":
      return "bg-[#ffc107] text-black"
    case "Check-in":
      return "bg-[#007bff] text-white"
    case "Cancelada":
    case "Completada":
      return "bg-[#6c757d] text-white"
  }
}

export function BookingCard({ reservation, formatDate, onCancel, onCheckIn, onCheckOut, readOnly = false }: BookingCardProps) {
  const uiStatus = useMemo(() => getUiStatus(reservation), [reservation])
  const guestName = useMemo(() => getGuestNamesDisplay(reservation), [reservation])
  const bedLabel = useMemo(() => getBedLabel(reservation), [reservation])

  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCheckInConfirmOpen, setIsCheckInConfirmOpen] = useState(false)
  const [isCheckInSubmitting, setIsCheckInSubmitting] = useState(false)
  const [checkInError, setCheckInError] = useState<string | null>(null)

  const [isCheckOutConfirmOpen, setIsCheckOutConfirmOpen] = useState(false)
  const [isCheckOutSubmitting, setIsCheckOutSubmitting] = useState(false)
  const [checkOutError, setCheckOutError] = useState<string | null>(null)

  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isCancelSubmitting, setIsCancelSubmitting] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

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
        "No se pudo realizar la acción. Intenta nuevamente."
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
        "No se pudo realizar la acción. Intenta nuevamente."
      setCheckOutError(msg)
    } finally {
      setIsCheckOutSubmitting(false)
    }
  }

  const openCheckInConfirm = () => {
    if (readOnly) return
    setCheckInError(null)
    setIsCheckInConfirmOpen(true)
  }

  const openCheckOutConfirm = () => {
    if (readOnly) return
    setCheckOutError(null)
    setIsCheckOutConfirmOpen(true)
  }

  const openCancelConfirm = () => {
    if (readOnly) return
    setCancelError(null)
    setIsCancelConfirmOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (readOnly) return
    if (!onCancel) return
    setIsCancelSubmitting(true)
    setCancelError(null)
    try {
      await onCancel(reservation.id)
      setIsCancelConfirmOpen(false)
    } catch (error) {
      const msg =
        (error as any)?.message ||
        (typeof error === "string" ? error : null) ||
        "No se pudo cancelar la reserva. Intenta nuevamente."
      setCancelError(msg)
    } finally {
      setIsCancelSubmitting(false)
    }
  }

  const reservationIdLabel = `Reserva #${reservation.id}`

  return (
    <>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-gray-900">{guestName || reservationIdLabel}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{reservationIdLabel}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getBadgeStyles(uiStatus)}`}>{uiStatus}</span>
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span aria-hidden>📅</span>
              <span className="truncate">
                {formatDate(reservation.checkIn)} - {formatDate(reservation.checkOut)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden>👥</span>
              <span>
                {reservation.guests} {reservation.guests === 1 ? "Huésped" : "Huéspedes"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden>🛏️</span>
              <span className="truncate">{bedLabel}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {uiStatus === "Pendiente" && !readOnly && (
              <>
                <Button className="bg-[#28a745] text-white hover:bg-[#218838]" onClick={openCheckInConfirm}>
                  Confirmar
                </Button>
                <Button variant="destructive" onClick={openCancelConfirm}>
                  Cancelar
                </Button>
              </>
            )}

            {uiStatus === "Confirmada" && (
              <>
                {!readOnly && (
                  <Button onClick={openCheckInConfirm} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Check-in
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailsOpen(true)}>
                  Ver Detalles
                </Button>
              </>
            )}

            {uiStatus === "Check-in" && (
              <>
                {!readOnly && (
                  <Button onClick={openCheckOutConfirm} className="bg-[#007bff] text-white hover:bg-[#0069d9]">
                    Check-out
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailsOpen(true)}>
                  Ver Detalles
                </Button>
              </>
            )}

            {(uiStatus === "Completada" || uiStatus === "Cancelada") && (
              <Button variant="outline" onClick={() => setIsDetailsOpen(true)}>
                Ver Detalles
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ResDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} reservation={reservation} formatDate={formatDate} />

      {!readOnly && (
        <>
          <ConfirmModal
            open={isCheckInConfirmOpen}
            title={uiStatus === "Pendiente" ? "Confirmar reserva" : "Confirmar check-in"}
            message={
              <div className="space-y-2">
                <p>{uiStatus === "Pendiente" ? "¿Confirmar esta reserva y realizar el check-in?" : "¿Realizar el check-in para esta reserva?"}</p>
                <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">{guestName || reservationIdLabel}</div>
                  <div>{reservationIdLabel}</div>
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
              <div className="space-y-2">
                <p>¿Realizar el check-out para esta reserva?</p>
                <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">{guestName || reservationIdLabel}</div>
                  <div>{reservationIdLabel}</div>
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
            open={isCancelConfirmOpen}
            title="Cancelar reserva"
            message={
              <div className="space-y-2">
                <p>¿Cancelar esta reserva?</p>
                <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">{guestName || reservationIdLabel}</div>
                  <div>{reservationIdLabel}</div>
                </div>
              </div>
            }
            cancelText="Volver"
            confirmText="Cancelar"
            loading={isCancelSubmitting}
            error={cancelError}
            onClose={() => (!isCancelSubmitting ? setIsCancelConfirmOpen(false) : null)}
            onConfirm={handleConfirmCancel}
          />
        </>
      )}
    </>
  )
}

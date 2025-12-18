// src/pages/ReservationPage.tsx

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Plus } from "lucide-react"
import { Button } from "../../components/ui/Button"
import type { reservation } from "../reservations/types/reservations"
import { useReservations } from "../reservations/hooks/useReservation"
import { fetchReservations } from "../reservations/services/reservationService"
import { ReservationForm } from "../reservations/resComponents/ReservationForm"
import { ExtendStayModal } from "../reservations/resComponents/ExtendStayModal"
import { ReservationsActiveView } from "../reservations/resComponents/ReservationsActiveView"
import { ReservationsHistoryView } from "../reservations/resComponents/ReservationsHistoryView"

export default function ReservationPage() {
  const {
    reservations,
    listError,
    isNewReservationOpen,
    setIsNewReservationOpen,
    isEditMode,
    checkInDate,
    setCheckInDate,
    checkOutDate,
    setCheckOutDate,
    checkInTime,
    setCheckInTime,
    checkOutTime,
    setCheckOutTime,
    guestCount,
    handleGuestCountChange,
    guests,
    updateGuest,
    availableBeds,
    getAvailableBedsForGuest,
    handleSaveReservation,
    removeReservation,
    openEditReservation,
    resetForm,
    loading,
    loadingBeds,
    isSaving,
    handleCheckIn,
    handleCheckOut,
    pendingCheckins,
    overdueCheckins,
    quickCheckIn,
    bulkCheckIn,
    markNoShow,
    snoozeReservation,
    extendReservationStay,
    checkInWarning,
    dismissCheckInWarning,
    fieldErrors,
    formError,
    clearFieldError,
  } = useReservations()

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  const [tab, setTab] = useState<"activas" | "historial">("activas")
  const [historyReservations, setHistoryReservations] = useState<reservation[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const [futureReservations, setFutureReservations] = useState<reservation[]>([])
  const [futureLoading, setFutureLoading] = useState(false)
  const [futureError, setFutureError] = useState<string | null>(null)
  const [futureLoaded, setFutureLoaded] = useState(false)

  const loadHistoryReservations = async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const data = await fetchReservations()
      setHistoryReservations(data)
      setHistoryLoaded(true)
    } catch (error) {
      const anyErr: any = error as any
      const msg = anyErr?.response?.data?.detail || anyErr?.message || "No se pudo cargar el historial."
      setHistoryError(msg)
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadFutureReservations = useCallback(async () => {
    setFutureLoading(true)
    setFutureError(null)
    try {
      const data = await fetchReservations()
      const nowTs = Date.now()
      const maxCache = 300
      const future = data
        .filter((r) => r.status === "activa" && !r.realCheckInDateTime && r.checkIn instanceof Date && !Number.isNaN(r.checkIn.getTime()))
        .filter((r) => r.checkIn.getTime() > nowTs)
        .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
        .slice(0, maxCache)
      setFutureReservations(future)
      setFutureLoaded(true)
    } catch (error) {
      const anyErr: any = error as any
      const msg = anyErr?.response?.data?.detail || anyErr?.message || "No se pudieron cargar las reservas próximas."
      setFutureError(msg)
    } finally {
      setFutureLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab !== "historial") return
    if (historyLoaded || historyLoading) return
    loadHistoryReservations()
  }, [tab, historyLoaded, historyLoading])

  useEffect(() => {
    if (tab !== "activas") return
    if (futureLoaded || futureLoading) return
    loadFutureReservations()
  }, [tab, futureLoaded, futureLoading, loadFutureReservations])

  useEffect(() => {
    const handler = () => loadFutureReservations()
    window.addEventListener("reservations:futureReload", handler as EventListener)
    return () => window.removeEventListener("reservations:futureReload", handler as EventListener)
  }, [loadFutureReservations])

  const handleNewReservation = () => {
    resetForm()
    setIsNewReservationOpen(true)
  }

  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [extendTarget, setExtendTarget] = useState<reservation | null>(null)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const openExtendModal = (reservation: reservation) => {
    setExtendTarget(reservation)
    setIsExtendModalOpen(true)
  }
  const closeExtendModal = () => {
    setIsExtendModalOpen(false)
    setExtendTarget(null)
  }

  const handleExtendStay = async (reservationId: number, newCheckOut: Date) => {
    const result = await extendReservationStay(reservationId, newCheckOut)
    if (result.ok) setFeedback({ type: "success", message: "Estadía extendida correctamente." })
    return result
  }

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

  return (
    <div className="space-y-6 p-6">
      {checkInWarning && (
        <div className="fixed right-6 top-24 z-50 w-full max-w-sm rounded-lg border border-amber-200 bg-amber-50 shadow-lg">
          <div className="flex items-start gap-3 p-4 text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Check-in adelantado</p>
              <p className="text-xs leading-relaxed text-amber-800">
                {`Registraste el check-in ${checkInWarning.minutesEarly} min antes de lo programado (${checkInWarning.scheduledAt.toLocaleString(
                  "es-AR",
                  { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" },
                )}).`}
              </p>
            </div>
            <Button
              aria-label="Cerrar aviso de check-in adelantado"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-amber-900"
              onClick={dismissCheckInWarning}
            >
              X
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reservas</h2>
          <p className="text-gray-600 mt-1">Gestión de reservas del hostel cápsula</p>
        </div>
        <Button onClick={handleNewReservation} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nueva Reserva
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant={tab === "activas" ? "default" : "outline"} onClick={() => setTab("activas")}>
          Activas
        </Button>
        <Button variant={tab === "historial" ? "default" : "outline"} onClick={() => setTab("historial")}>
          Historial
        </Button>
      </div>

      {feedback && (
        <div
          className={`flex items-start justify-between rounded-lg border p-4 ${
            feedback.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <p className="text-sm">{feedback.message}</p>
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)}>
            Cerrar
          </Button>
        </div>
      )}

      {tab === "activas" ? (
        <ReservationsActiveView
          reservations={reservations}
          loading={loading}
          error={listError}
          futureReservations={futureReservations}
          futureLoading={futureLoading}
          futureError={futureError}
          onReloadFuture={loadFutureReservations}
          formatDate={formatDate}
          pendingCheckins={pendingCheckins}
          overdueCheckins={overdueCheckins}
          onEdit={openEditReservation}
          onDelete={removeReservation}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onExtend={openExtendModal}
          bulkCheckIn={bulkCheckIn}
          quickCheckIn={quickCheckIn}
          markNoShow={markNoShow}
          snoozeReservation={snoozeReservation}
        />
      ) : (
        <ReservationsHistoryView
          reservations={historyReservations}
          loading={historyLoading}
          error={historyError}
          formatDate={formatDate}
          onRefresh={historyLoaded ? loadHistoryReservations : undefined}
        />
      )}

      <ReservationForm
        isOpen={isNewReservationOpen}
        onOpenChange={setIsNewReservationOpen}
        onSaveReservation={handleSaveReservation}
        isEditMode={isEditMode}
        checkInDate={checkInDate}
        setCheckInDate={setCheckInDate}
        checkOutDate={checkOutDate}
        setCheckOutDate={setCheckOutDate}
        checkInTime={checkInTime}
        setCheckInTime={setCheckInTime}
        checkOutTime={checkOutTime}
        setCheckOutTime={setCheckOutTime}
        guestCount={guestCount}
        handleGuestCountChange={handleGuestCountChange}
        guests={guests}
        updateGuest={updateGuest}
        availableBeds={availableBeds}
        getAvailableBedsForGuest={getAvailableBedsForGuest}
        loadingBeds={loadingBeds}
        isSaving={isSaving}
        fieldErrors={fieldErrors}
        formError={formError}
        clearFieldError={clearFieldError}
      />

      <ExtendStayModal open={isExtendModalOpen} onClose={closeExtendModal} reservation={extendTarget} onSuccess={handleExtendStay} />
    </div>
  )
}

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Plus } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import type { reservation } from "./types/reservations"
import { useReservations } from "./hooks/useReservation"
import { fetchReservations } from "./services/reservationService"
import { ReservationForm } from "./resComponents/ReservationForm"
import { BookingCard } from "./resComponents/BookingCard"

type StatusFilter = "todas" | "activas" | "pendientes" | "completadas" | "canceladas"

const pad = (n: number) => String(n).padStart(2, "0")
const toDateInput = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const normalize = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

function getUiStatus(reservation: reservation) {
  if (reservation.status === "cancelada") return "Cancelada"
  if (reservation.status === "completada") return "Completada"
  const isCheckedIn = Boolean(reservation.realCheckInDateTime) || reservation.status === "en_progreso" || reservation.status === "ocupada"
  if (isCheckedIn) return "Check-in"
  const checkInTs = reservation.checkIn instanceof Date ? reservation.checkIn.getTime() : NaN
  if (!Number.isFinite(checkInTs)) return "Confirmada"
  return checkInTs <= Date.now() ? "Pendiente" : "Confirmada"
}

export function BookingManagementPage() {
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
    resetForm,
    loading,
    loadingBeds,
    isSaving,
    handleCheckIn,
    handleCheckOut,
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

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(60)

  const [allReservations, setAllReservations] = useState<reservation[]>([])
  const [allLoading, setAllLoading] = useState(false)
  const [allError, setAllError] = useState<string | null>(null)
  const [allLoaded, setAllLoaded] = useState(false)

  const needsAll = statusFilter === "todas" || statusFilter === "completadas" || statusFilter === "canceladas"

  const loadAllReservations = async () => {
    setAllLoading(true)
    setAllError(null)
    try {
      const data = await fetchReservations()
      setAllReservations(data)
      setAllLoaded(true)
    } catch (error) {
      const anyErr: any = error as any
      const msg = anyErr?.response?.data?.detail || anyErr?.message || "No se pudo cargar la lista de reservas."
      setAllError(msg)
    } finally {
      setAllLoading(false)
    }
  }

  useEffect(() => {
    if (!needsAll) return
    if (allLoaded || allLoading) return
    loadAllReservations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsAll])

  useEffect(() => {
    if (!fromDate && !toDate) {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
      setFromDate(toDateInput(from))
      setToDate(toDateInput(now))
    }
  }, [fromDate, toDate])

  const baseList = useMemo(() => {
    if (needsAll && allLoaded) return allReservations
    if (needsAll && !allLoaded) return reservations
    return reservations
  }, [needsAll, allLoaded, allReservations, reservations])

  const filtered = useMemo(() => {
    const q = normalize(query)
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null

    const matchQuery = (r: reservation) => {
      if (!q) return true
      const beds = r.guestDetails.map((g) => (g.bedNumber != null ? String(g.bedNumber) : "")).filter(Boolean).join(" ")
      const names = r.guestDetails.map((g) => `${g.name} ${g.lastName}`.trim()).filter(Boolean).join(" ")
      const dnis = r.guestDetails.map((g) => g.dni).filter(Boolean).join(" ")
      const haystack = normalize(`${r.id} ${names} ${dnis} ${beds}`)
      return haystack.includes(q)
    }

    const matchStatus = (r: reservation) => {
      if (statusFilter === "todas") return true
      if (statusFilter === "completadas") return r.status === "completada"
      if (statusFilter === "canceladas") return r.status === "cancelada"
      if (statusFilter === "pendientes") return getUiStatus(r) === "Pendiente"
      return r.status !== "completada" && r.status !== "cancelada"
    }

    return baseList
      .filter((r) => {
        if (from && r.checkIn.getTime() < from.getTime()) return false
        if (to && r.checkIn.getTime() > to.getTime()) return false
        return matchStatus(r) && matchQuery(r)
      })
      .sort((a, b) => {
        if (statusFilter === "completadas" || statusFilter === "canceladas") return b.checkIn.getTime() - a.checkIn.getTime()
        if (statusFilter === "pendientes") return a.checkIn.getTime() - b.checkIn.getTime()
        if (statusFilter === "todas") {
          const order: Record<string, number> = { Pendiente: 0, Confirmada: 1, "Check-in": 2, Completada: 3, Cancelada: 4 }
          const ao = order[getUiStatus(a)] ?? 99
          const bo = order[getUiStatus(b)] ?? 99
          if (ao !== bo) return ao - bo
          return a.checkIn.getTime() - b.checkIn.getTime()
        }
        return a.checkIn.getTime() - b.checkIn.getTime()
      })
  }, [baseList, fromDate, toDate, query, statusFilter])

  const visible = filtered.slice(0, limit)

  const handleClearFilters = () => {
    setStatusFilter("todas")
    setFromDate("")
    setToDate("")
    setQuery("")
    setLimit(60)
  }

  const handleNewReservation = () => {
    resetForm()
    setIsNewReservationOpen(true)
  }

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "todas", label: "Todas" },
    { value: "activas", label: "Activas" },
    { value: "pendientes", label: "Pendientes" },
    { value: "completadas", label: "Completadas" },
    { value: "canceladas", label: "Canceladas" },
  ]

  const activeButtonClass = "bg-primary text-primary-foreground shadow-sm"
  const inactiveButtonClass = "text-gray-700 hover:bg-accent hover:text-accent-foreground"

  const showLoading = loading || (needsAll && allLoading && !allLoaded)
  const showError = listError || allError

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
          <p className="text-gray-600 mt-1">Gestión rápida y clara para el staff</p>
        </div>
        <Button onClick={handleNewReservation} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nueva Reserva
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="inline-flex w-full flex-wrap gap-1 rounded-lg bg-muted p-1 lg:w-auto">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setStatusFilter(opt.value)
                  setLimit(60)
                }}
                className={`h-9 rounded-md px-3 text-sm font-medium transition-colors ${statusFilter === opt.value ? activeButtonClass : inactiveButtonClass}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:flex-1">
            <div className="relative flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
              <span className="select-none" aria-hidden>
                📅
              </span>
              <Input
                className="h-8 border-0 p-0 shadow-none focus-visible:ring-0"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setLimit(60)
                }}
                aria-label="Desde"
              />
              <span className="text-gray-400">–</span>
              <Input
                className="h-8 border-0 p-0 shadow-none focus-visible:ring-0"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setLimit(60)
                }}
                aria-label="Hasta"
              />
            </div>

            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 select-none" aria-hidden>
                🔍
              </span>
              <Input
                className="pl-9"
                placeholder="Buscar por nombre o reserva..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setLimit(60)
                }}
              />
            </div>

            <Button variant="link" className="h-10 justify-start lg:justify-end" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
          <div>
            Mostrando {visible.length} de {filtered.length}
          </div>
          {needsAll && !allLoaded && (
            <div className="text-xs text-gray-500">Cargando datos globales para filtros…</div>
          )}
        </div>
      </div>

      {showError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{showError}</div>}

      {showLoading && (
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">Cargando reservas…</div>
      )}

      {!showLoading && visible.length === 0 && (
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">No hay resultados con los filtros actuales.</div>
      )}

      {!showLoading && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => {
            const isHistorical = r.status === "completada" || r.status === "cancelada"
            return isHistorical ? (
              <BookingCard key={r.id} reservation={r} formatDate={formatDate} readOnly />
            ) : (
              <BookingCard
                key={r.id}
                reservation={r}
                formatDate={formatDate}
                onCancel={removeReservation}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
              />
            )
          })}
        </div>
      )}

      {!showLoading && filtered.length > visible.length && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimit((prev) => prev + 60)}>
            Mostrar más
          </Button>
        </div>
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
    </div>
  )
}

import { useMemo, useState } from "react"
import { AlertTriangle, Ban, Clock, Loader2, UserCheck } from "lucide-react"
import type { reservation } from "../types/reservations"
import { ReservationCard } from "./ReservationCard"
import { Button } from "../../../components/ui/Button"

interface ReservationsActiveViewProps {
  reservations: reservation[]
  loading: boolean
  error?: string | null
  futureReservations: reservation[]
  futureLoading: boolean
  futureError?: string | null
  onReloadFuture?: () => void
  formatDate: (date: Date) => string
  pendingCheckins: reservation[]
  overdueCheckins: reservation[]
  onEdit: (reservation: reservation) => void
  onDelete: (id: number) => void
  onCheckIn: (id: number) => Promise<void>
  onCheckOut: (id: number) => Promise<void>
  onExtend: (reservation: reservation) => void
  bulkCheckIn: (ids: number[]) => Promise<void>
  quickCheckIn: (id: number) => Promise<void>
  markNoShow: (id: number) => Promise<void>
  snoozeReservation: (id: number, minutes: number) => void
}

export function ReservationsActiveView({
  reservations,
  loading,
  error,
  futureReservations,
  futureLoading,
  futureError,
  onReloadFuture,
  formatDate,
  pendingCheckins,
  overdueCheckins,
  onEdit,
  onDelete,
  onCheckIn,
  onCheckOut,
  onExtend,
  bulkCheckIn,
  quickCheckIn,
  markNoShow,
  snoozeReservation,
}: ReservationsActiveViewProps) {
  const [showPendingPanel, setShowPendingPanel] = useState(false)
  const [selectedPendingIds, setSelectedPendingIds] = useState<number[]>([])
  const [upcomingLimit, setUpcomingLimit] = useState(20)

  const toggleSelectPending = (id: number) => {
    setSelectedPendingIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const allPendingIds = useMemo(() => pendingCheckins.map((r) => r.id), [pendingCheckins])
  const toggleSelectAllPending = () => {
    setSelectedPendingIds((prev) => (prev.length === allPendingIds.length ? [] : allPendingIds))
  }

  const nowTs = Date.now()
  const windowHours = 24
  const upcomingWindowMs = windowHours * 60 * 60 * 1000
  const inHouse = useMemo(
    () =>
      reservations
        .filter((r) => r.status === "en_progreso" && Boolean(r.realCheckInDateTime))
        .sort((a, b) => a.checkOut.getTime() - b.checkOut.getTime()),
    [reservations],
  )

  const upcomingAll = useMemo(() => {
    const valid = futureReservations.filter((r) => r.checkIn instanceof Date && !Number.isNaN(r.checkIn.getTime()))
    return [...valid].sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
  }, [futureReservations])

  const visibleUpcoming = useMemo(() => {
    const windowEnd = nowTs + upcomingWindowMs
    const within24hCount = upcomingAll.filter((r) => r.checkIn.getTime() <= windowEnd).length
    const minCount = Math.max(20, within24hCount)
    const count = Math.max(upcomingLimit, minCount)
    return upcomingAll.slice(0, count)
  }, [upcomingAll, nowTs, upcomingWindowMs, upcomingLimit])

  const pendingSorted = useMemo(() => {
    const overdueSet = new Set(overdueCheckins.map((r) => r.id))
    return [...pendingCheckins].sort((a, b) => {
      const ao = overdueSet.has(a.id) ? 0 : 1
      const bo = overdueSet.has(b.id) ? 0 : 1
      if (ao !== bo) return ao - bo
      return a.checkIn.getTime() - b.checkIn.getTime()
    })
  }, [pendingCheckins, overdueCheckins])

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      {/* Banner de pendientes de check-in */}
      {pendingCheckins.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <span>{`${pendingCheckins.length} check-ins pendientes`}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPendingPanel(true)}>
            Ver pendientes
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Cargando reservas activas...</span>
        </div>
      )}

      {!loading && reservations.length === 0 && (
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">No hay reservas activas.</div>
      )}

      {!loading && reservations.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-amber-900">{pendingCheckins.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium">En curso</p>
              <p className="text-2xl font-bold text-green-900">{inHouse.length}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium">Próximas</p>
              <p className="text-2xl font-bold text-blue-900">{visibleUpcoming.length}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Check-ins pendientes</h3>
            {pendingSorted.length === 0 ? (
              <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">No hay check-ins pendientes.</div>
            ) : (
              <div className="grid gap-4">
                {pendingSorted.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    formatDate={formatDate}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onCheckIn={onCheckIn}
                    onCheckOut={onCheckOut}
                    onExtend={onExtend}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">En curso</h3>
            {inHouse.length === 0 ? (
              <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">No hay huéspedes actualmente.</div>
            ) : (
              <div className="grid gap-4">
                {inHouse.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    formatDate={formatDate}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onCheckIn={onCheckIn}
                    onCheckOut={onCheckOut}
                    onExtend={onExtend}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Próximas</h3>
            {futureError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start justify-between gap-2">
                <span>{futureError}</span>
                {onReloadFuture && (
                  <Button variant="outline" size="sm" onClick={onReloadFuture}>
                    Reintentar
                  </Button>
                )}
              </div>
            )}

            {futureLoading && (
              <div className="flex items-center gap-2 rounded-lg border bg-white p-4 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                Cargando reservas próximas...
              </div>
            )}

            {!futureLoading && !futureError && visibleUpcoming.length === 0 && (
              <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">No hay reservas próximas.</div>
            )}

            {!futureLoading && visibleUpcoming.length > 0 && (
              <div className="grid gap-4">
                {visibleUpcoming.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    formatDate={formatDate}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onCheckIn={onCheckIn}
                    onCheckOut={onCheckOut}
                    onExtend={onExtend}
                  />
                ))}
              </div>
            )}
            {upcomingAll.length > visibleUpcoming.length && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setUpcomingLimit((prev) => prev + 20)}>
                  Mostrar más
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Panel de pendientes de check-in */}
      {showPendingPanel && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" /> Pendientes de Check-in
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowPendingPanel(false)}>
                Cerrar
              </Button>
            </div>
            <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
              <div>
                Pendientes: {pendingCheckins.length}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleSelectAllPending}>
                  {selectedPendingIds.length === allPendingIds.length ? "Deseleccionar" : "Seleccionar todos"}
                </Button>
                <Button
                  size="sm"
                  disabled={selectedPendingIds.length === 0}
                  onClick={async () => {
                    await bulkCheckIn(selectedPendingIds)
                    setSelectedPendingIds([])
                    setShowPendingPanel(false)
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-1" /> Check-in ({selectedPendingIds.length})
                </Button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y border rounded">
              {pendingCheckins.map((r) => (
                <div key={r.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPendingIds.includes(r.id)}
                      onChange={() => toggleSelectPending(r.id)}
                    />
                    <div>
                      <div className="font-medium">Reserva #{r.id}</div>
                      <div className="text-xs text-gray-600">Check-in: {r.checkIn.toLocaleString("es-AR")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => snoozeReservation(r.id, 10)}>
                      Posponer 10 min
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => markNoShow(r.id)} title="Marcar como no show">
                      <Ban className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        await quickCheckIn(r.id)
                        setSelectedPendingIds((prev) => prev.filter((x) => x !== r.id))
                      }}
                    >
                      Check-in
                    </Button>
                  </div>
                </div>
              ))}
              {pendingCheckins.length === 0 && <div className="p-4 text-sm text-gray-500">No hay pendientes</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

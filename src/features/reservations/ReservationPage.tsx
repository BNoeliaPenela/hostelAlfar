// src/pages/ReservationPage.tsx

import { useReservations } from "../reservations/hooks/useReservation"
import { ReservationCard } from "../reservations/resComponents/ReservationCard"
import { ReservationForm } from "../reservations/resComponents/ReservationForm"
import { Plus, Calendar, Loader2, AlertTriangle, Clock, UserCheck, Ban } from "lucide-react"
import { useState } from "react"
import { Button } from "../../components/ui/Button"

export default function ReservationPage() {
  const {
    reservations,
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
    handleCheckIn,
    handleCheckOut,
    pendingCheckins,
    overdueCheckins,
    quickCheckIn,
    bulkCheckIn,
    markNoShow,
    snoozeReservation,
    handleExtendReservation,
  } = useReservations()

  const formatDate = (date: Date) => date.toLocaleDateString("es-ES", {
    day: '2-digit',
    month: 'short',
    year: 'numeric'})

  const handleNewReservation = () => {
  resetForm()
  setIsNewReservationOpen(true)
  }
  const activeReservations = reservations
  .filter(r => r.status === "activa" || r.status === "en_progreso")
  .sort((a, b) => {
    // Prioriza las reservas en progreso arriba
    if (a.status === "en_progreso" && b.status !== "en_progreso") return -1
    if (a.status !== "en_progreso" && b.status === "en_progreso") return 1
    // Si ambas tienen el mismo estado, ordená por fecha de check-in más próxima
    return a.checkIn.getTime() - b.checkIn.getTime()
  })
  
  const completedReservations = reservations.filter(r => r.status === "completada")
  const [showPendingPanel, setShowPendingPanel] = useState(false)
  const [selectedPendingIds, setSelectedPendingIds] = useState<number[]>([])
  const toggleSelectPending = (id: number) => {
    setSelectedPendingIds((prev: number[]) => prev.includes(id) ? prev.filter((x: number) => x !== id) : [...prev, id])
  }
  const allPendingIds = pendingCheckins.map(r => r.id)
  const toggleSelectAllPending = () => {
    setSelectedPendingIds((prev: number[]) => prev.length === allPendingIds.length ? [] : allPendingIds)
  }
 return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reservas</h2>
          <p className="text-gray-600 mt-1">
            Gestión de reservas del hostel cápsula
          </p>
        </div>
        <Button onClick={handleNewReservation} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nueva Reserva
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Reservas Activas</p>
              <p className="text-2xl font-bold text-blue-900">{activeReservations.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Completadas</p>
              <p className="text-2xl font-bold text-green-900">{completedReservations.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Reservas</p>
              <p className="text-2xl font-bold text-purple-900">{reservations.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Banner de pendientes de check-in */}
      {(pendingCheckins.length > 0) && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <span>
              {overdueCheckins.length > 0 ? `${overdueCheckins.length} vencid${overdueCheckins.length===1?'o':'os'}` : ''}
              {overdueCheckins.length > 0 && (pendingCheckins.length - overdueCheckins.length) > 0 ? ', ' : ''}
              {(pendingCheckins.length - overdueCheckins.length) > 0 ? `${pendingCheckins.length - overdueCheckins.length} próximos` : ''}
              {` check-ins pendientes`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPendingPanel(true)}>
              Ver pendientes
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Cargando reservas...</span>
        </div>
      )}

      {/* Active Reservations */}
      {!loading && activeReservations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Reservas Activas</h3>
          <div className="grid gap-4">
              {activeReservations.map((reservation) => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation} 
                  formatDate={formatDate}
                  onEdit={openEditReservation}
                  onDelete={removeReservation}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onExtend={handleExtendReservation}
                />
              ))}
          </div>
        </div>
      )}

      {/* Completed Reservations */}
      {!loading && completedReservations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Reservas Completadas</h3>
          <div className="grid gap-4">
              {completedReservations.map((reservation) => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation} 
                  formatDate={formatDate}
                  onEdit={openEditReservation}
                  onDelete={removeReservation}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onExtend={handleExtendReservation}
                />
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && reservations.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay reservas
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza creando tu primera reserva
          </p>
          <Button onClick={handleNewReservation}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      )}

      {/* Reservation Form Modal */}
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
        loading={loading}
        loadingBeds={loadingBeds}
      />

      {/* Panel de pendientes de check-in */}
      {showPendingPanel && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" /> Pendientes de Check-in
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowPendingPanel(false)}>Cerrar</Button>
            </div>
            <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
              <div>
                Vencidos: {overdueCheckins.length} · Próximos (≤15 min): {pendingCheckins.length - overdueCheckins.length}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleSelectAllPending}>
                  {selectedPendingIds.length === allPendingIds.length ? 'Deseleccionar' : 'Seleccionar todos'}
                </Button>
                <Button size="sm" disabled={selectedPendingIds.length === 0} onClick={async () => { await bulkCheckIn(selectedPendingIds); setSelectedPendingIds([]); setShowPendingPanel(false) }}>
                  <UserCheck className="h-4 w-4 mr-1" /> Check-in ({selectedPendingIds.length})
                </Button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y border rounded">
              {pendingCheckins.map(r => (
                <div key={r.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selectedPendingIds.includes(r.id)} onChange={() => toggleSelectPending(r.id)} />
                    <div>
                      <div className="font-medium">Reserva #{r.id}</div>
                      <div className="text-xs text-gray-600">Check-in: {r.checkIn.toLocaleString('es-AR')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => snoozeReservation(r.id, 10)}>Posponer 10 min</Button>
                    <Button variant="outline" size="sm" onClick={() => markNoShow(r.id)} title="Marcar como no show">
                      <Ban className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={async () => { await quickCheckIn(r.id); setSelectedPendingIds((prev: number[]) => prev.filter((x: number) => x!==r.id)) }}>
                      Check-in
                    </Button>
                  </div>
                </div>
              ))}
              {pendingCheckins.length === 0 && (
                <div className="p-4 text-sm text-gray-500">No hay pendientes</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

  

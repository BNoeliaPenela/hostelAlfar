// src/pages/ReservationPage.tsx

import { useReservations } from "../reservations/hooks/useReservation"
import { ReservationCard } from "../reservations/resComponents/ReservationCard"
import { ReservationForm } from "../reservations/resComponents/ReservationForm"
import { Plus, Calendar, Loader2  } from "lucide-react"
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
// Handler para crear reserva
  /*const handleCreateReservation = () => { //
    addReservation({
      id: 0,
      guestName: guests.map(g => g.name).join(", "),
      checkIn: new Date(checkInDate),
      checkOut: new Date(checkOutDate),
      bedNumber: selectedBed,
      status: "activa",
      guests: guests.length
    });
    setIsNewReservationOpen(false);
    // Opcional: limpia los campos si quieres
  };*/

  /*return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reservas Activas</h2>
        <Button onClick={() => setIsNewReservationOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Reserva
        </Button>
      </div>

      <div className="grid gap-4">
        {reservations.map((reservation) => (
          <ReservationCard key={reservation.id} reservation={reservation} formatDate={formatDate} />
        ))}
      </div>

      <ReservationForm
        isOpen={isNewReservationOpen}
        onOpenChange={setIsNewReservationOpen}
        checkInDate={checkInDate}
        setCheckInDate={setCheckInDate}
        checkOutDate={checkOutDate}
        setCheckOutDate={setCheckOutDate}
        guestCount={guestCount}
        handleGuestCountChange={handleGuestCountChange}
        guests={guests}
        updateGuest={updateGuest}
        toggleAmenity={toggleAmenity}
        removeGuest={removeGuest}
        availableBeds={availableBeds}
        onCreateReservation={handleCreateReservation}
        selectedBed={selectedBed}         // <-- valor actual
        selectBed={setSelectedBed}        // <-- función para cambiar cama
      />
    </div>
  )*/
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
    </div>
  )
}

  

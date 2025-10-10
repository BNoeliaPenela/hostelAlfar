// src/pages/ReservationPage.tsx

import { useReservations } from "../reservations/hooks/useReservation"
import { ReservationCard } from "../reservations/resComponents/ReservationCard"
import { ReservationForm } from "../reservations/resComponents/ReservationForm"
import { Plus } from "lucide-react"
import { Button } from "../../components/ui/Button"

export default function ReservationPage() {
  const {
    reservations,
    isNewReservationOpen,
    setIsNewReservationOpen,
    checkInDate,
    setCheckInDate,
    checkOutDate,
    setCheckOutDate,
    guestCount,
    handleGuestCountChange,
    guests,
    updateGuest,
    toggleAmenity,
    removeGuest,
    availableBeds,
    addReservation,
    setSelectedBed,
    selectedBed // Nuevo handler para crear reserva
  } = useReservations()

  const formatDate = (date: Date) => date.toLocaleDateString("es-ES")

// Handler para crear reserva
  const handleCreateReservation = () => { //
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
  };

  return (
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
  )
}

  

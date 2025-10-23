import type { reservation } from "../types/reservations"
import { ReservationCard } from "./ReservationCard"

interface ReservationsListProps {
  reservations: reservation[]
  formatDate: (date: Date) => string
  onEdit: (reservation: reservation) => void
  onDelete: (id: number) => void
  onCheckIn: (id: number) => void
  onCheckOut: (id: number) => void
}

export function ReservationsList({ reservations, formatDate, onEdit, onDelete, onCheckIn, onCheckOut }: ReservationsListProps) {
  return (
    <div className="grid gap-4">
      {reservations.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          reservation={reservation}
          formatDate={formatDate}
          onEdit={onEdit}
          onDelete={onDelete}
          onCheckIn={onCheckIn}
          onCheckOut={onCheckOut}
        />
      ))}
    </div>
  )
}

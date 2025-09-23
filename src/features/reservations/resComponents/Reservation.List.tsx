import type { reservation } from "../types/reservations"
import { ReservationCard } from "./ReservationCard"
interface ReservationsListProps {
  reservations: reservation[]
  formatDate: (date: Date) => string
}
export function ReservationsList({ reservations, formatDate }: ReservationsListProps) {
  return (
    <div className="grid gap-4">
      {reservations.map((reservation) => (
        <ReservationCard key={reservation.id} reservation={reservation} formatDate={formatDate} />
      ))}
    </div>
  )
}
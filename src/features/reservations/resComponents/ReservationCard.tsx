import type { reservation } from "../types/reservations"
import { BookingCard } from "./BookingCard"

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

export function ReservationCard({ reservation, formatDate, onDelete, onCheckIn, onCheckOut, readOnly = false }: ReservationCardProps) {
  return (
    <BookingCard
      reservation={reservation}
      formatDate={formatDate}
      readOnly={readOnly as any}
      onCancel={onDelete as any}
      onCheckIn={onCheckIn as any}
      onCheckOut={onCheckOut as any}
    />
  )
}


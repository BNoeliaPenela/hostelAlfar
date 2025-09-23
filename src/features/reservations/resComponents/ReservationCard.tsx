import type { reservation } from "../types/reservations"
import { Card, CardContent } from "../../../components/ui/Card"
import { Badge } from "../../../components/ui/Badge"
import { Users } from "lucide-react"
interface ReservationCardProps {
  reservation: reservation
  formatDate: (date: Date) => string
}
export function ReservationCard({ reservation, formatDate }: ReservationCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="font-semibold">{reservation.guestName}</h3>
              <p className="text-sm text-gray-600">
                {formatDate(reservation.checkIn)} - {formatDate(reservation.checkOut)}
              </p>
            </div>
            <Badge variant="outline">Cama {reservation.bedNumber}</Badge>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {reservation.guests} {reservation.guests === 1 ? "persona" : "personas"}
            </Badge>
          </div>
          <Badge variant={reservation.status === "activa" ? "default" : "secondary"}>
            {reservation.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
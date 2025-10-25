import type { reservation } from "../types/reservations"
import { Card, CardContent } from "../../../components/ui/Card"
import { Badge } from "../../../components/ui/Badge"
import { Button } from "../../../components/ui/Button"
import { Users, Edit, Trash2, Bed, Eye, LogIn, LogOut, Sparkles, Clock } from "lucide-react"
import { useState } from "react"
import { ResDetailsModal } from "./ResDetailsModal"
import { cleanBedsByNumbers } from "../services/reservationService"

interface ReservationCardProps {
  reservation: reservation
  formatDate: (date: Date) => string
  onEdit: (reservation: reservation) => void
  onDelete: (id: number) => void
  onCheckIn: (id: number) => void
  onCheckOut: (id: number) => void
  onExtend: (id: number) => void
}
export function ReservationCard({ 
  reservation, 
  formatDate, 
  onEdit, 
  onDelete,
  onCheckIn,
  onCheckOut,
  onExtend,
 }: ReservationCardProps) {
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const getStatusText = (status: string) => {
    switch (status) {
      case "activa":
        return "Activa"
      case "en_progreso":
        return "En progreso"
      case "completada":
        return "Completada"
      case "cancelada":
        return "Cancelada"
      default:
        return status
    }
  }

  const getGuestNamesDisplay = () => {
    const names = reservation.guestDetails.map(g => `${g.name} ${g.lastName}`)
    
    if (names.length <= 2) {
      return names.join(", ")
    }
    
    const remaining = names.length - 2
    return `${names[0]}, ${names[1]} y ${remaining} más`
  }
  const bedNumbers = reservation.guestDetails
    .map(g => g.bedNumber)
    .filter(bed => bed !== null)
    .join(", ")
     // Determina qué botones mostrar según el estado
  const showCheckIn = !reservation.realCheckInDateTime
  const showCheckOut = !!reservation.realCheckInDateTime && reservation.status !== 'completada'
  const canCheckOut = reservation.realCheckInDateTime
    ? Date.now() >= (reservation.realCheckInDateTime.getTime() + 60 * 60 * 1000)
    : false
  const checkOutTitle = showCheckOut && !canCheckOut
    ? `Disponible desde ${(reservation.realCheckInDateTime ? new Date(reservation.realCheckInDateTime.getTime() + 60*60*1000) : reservation.checkOut).toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'})}`
    : undefined

  const handleCleanBeds = async () => {
    const beds = reservation.guestDetails
      .map(g => g.bedNumber)
      .filter((n): n is number => typeof n === 'number')
    if (beds.length === 0) return
    await cleanBedsByNumbers(beds)
    try { window.dispatchEvent(new Event('beds:reload')) } catch {}
    alert('Camas marcadas como limpias')
  }

  return (
     <>
      <Card className="hover:shadow-lg transition-all">
        <CardContent className="p-5">
          <div className="space-y-3">
            {/* Header con nombres, estado y botones pequeños */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{getGuestNamesDisplay()}</h3>
                  <Badge variant={reservation.status === "activa" ? "default" : "secondary"}>
                    {getStatusText(reservation.status)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  📅 {formatDate(reservation.checkIn)} - {formatDate(reservation.checkOut)}
                </p>
              </div>

              {/* Botones pequeños arriba a la derecha */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailsOpen(true)}
                  className="h-8 px-2 text-xs"
                  title="Ver detalles"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Detalles
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(reservation)}
                  className="h-8 px-2 text-xs hover:bg-blue-50"
                  title="Editar reserva"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(reservation.id)}
                  className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Eliminar reserva"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>

            {/* Info rápida: personas y camas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {reservation.guests} {reservation.guests === 1 ? "persona" : "personas"}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  Camas: {bedNumbers}
                </Badge>
              </div>

              {/* Botones CHECK IN / CHECK OUT */}
              <div className="flex gap-2">
                {showCheckIn && (
                  <Button
                    onClick={() => onCheckIn(reservation.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    CHECK IN
                  </Button>
                )}
                {showCheckOut && (
                  <Button
                    onClick={() => onCheckOut(reservation.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                    disabled={!canCheckOut}
                    title={checkOutTitle}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    CHECK OUT
                  </Button>
                )}
                {(reservation.status === 'activa' || reservation.status === 'en_progreso') && (
                  <Button
                    onClick={() => onExtend(reservation.id)}
                    variant="outline"
                    size="sm"
                    title="Extender estancia"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Extender
                  </Button>
                )}
                {reservation.status === 'completada' && (
                  <Button
                    onClick={handleCleanBeds}
                    variant="outline"
                    size="sm"
                    title="Marcar todas las camas de esta reserva como limpias"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Limpiar camas
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      <ResDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        reservation={reservation}
        formatDate={formatDate}
      />
    </>
  )
 
}

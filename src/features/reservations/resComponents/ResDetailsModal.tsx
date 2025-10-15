import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/Dialog"
import { Button } from "../../../components/ui/Button"
import { Badge } from "../../../components/ui/Badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card"
import { Calendar, Bed, User, Mail, MapPin, Car, FileText, Coffee } from "lucide-react"
import type { reservation } from "../types/reservations"


interface ResDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: reservation
  formatDate: (date: Date) => string
}

export function ResDetailsModal({
  isOpen,
  onClose,
  reservation,
  formatDate,
}: ResDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="h-6 w-6" />
            Detalles de la Reserva #{reservation.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Información general de la reserva */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Check-in</p>
                  <p className="font-semibold text-lg">
                    {formatDate(reservation.checkIn)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Check-out</p>
                  <p className="font-semibold text-lg">
                    {formatDate(reservation.checkOut)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de huéspedes</p>
                  <p className="font-semibold text-lg">{reservation.guests}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  <Badge variant="default" className="text-sm">
                    {reservation.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles de cada huésped */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900">
              Información de huéspedes
            </h3>

            {reservation.guestDetails.map((guest, idx) => (
              <Card key={idx} className="border-2">
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Huésped {idx + 1}
                    </span>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Bed className="h-3 w-3" />
                      Cama {guest.bedNumber}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Datos personales */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase font-medium">
                        Nombre completo
                      </p>
                      <p className="font-semibold text-gray-900">
                        {guest.name} {guest.lastName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase font-medium">
                        DNI
                      </p>
                      <p className="font-semibold text-gray-900">{guest.dni}</p>
                    </div>
                  </div>

                  {/* Contacto y ubicación */}
                  {(guest.email || guest.origin) && (
                    <div className="grid grid-cols-2 gap-4">
                      {guest.email && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email
                          </p>
                          <p className="text-sm text-gray-700 break-all">{guest.email}</p>
                        </div>
                      )}
                      {guest.origin && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Origen
                          </p>
                          <p className="text-sm text-gray-700">{guest.origin}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Patente */}
                  {guest.license && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        Patente
                      </p>
                      <p className="text-sm text-gray-700">{guest.license}</p>
                    </div>
                  )}

                  {/* Amenities */}
                  {guest.amenities.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 uppercase font-medium">
                        Amenities incluidos
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {guest.amenities.map((amenity, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Desayuno */}
                  {guest.breakfast && (
                    <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 p-2 rounded-md">
                      <Coffee className="h-4 w-4" />
                      <span className="font-medium">Incluye desayuno</span>
                    </div>
                  )}

                  {/* Notas */}
                  {guest.notes && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Notas adicionales
                      </p>
                      <p className="text-sm text-gray-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                        {guest.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Botón cerrar */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} size="lg">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


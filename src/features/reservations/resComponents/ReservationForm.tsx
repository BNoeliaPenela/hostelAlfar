import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card"
import { Button } from "../../../components/ui/Button"
import { Input } from "../../../components/ui/Input"
import { Label } from "../../../components/ui/Label"
import { Textarea } from "../../../components/ui/TextTarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/Dialog"
import { Checkbox } from "../../../components/ui/Checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/Select"
import { Badge } from "../../../components/ui/Badge"
import { AlertCircle, Bed, Calendar, CheckCircle2, Loader2, Trash2 } from "lucide-react"
import type { GuestData } from "../types/reservations"

interface ReservationFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSaveReservation: () => void
  isEditMode: boolean
  checkInDate: string
  setCheckInDate: (date: string) => void
  checkOutDate: string
  setCheckOutDate: (date: string) => void
  guestCount: number
  handleGuestCountChange: (count: string) => void
  guests: GuestData[]
  updateGuest: (index: number, field: keyof GuestData, value: any) => void
  toggleAmenity: (guestIndex: number, amenity: string) => void
  removeGuest: (index: number) => void
  availableBeds: number[]
  getAvailableBedsForGuest: (guestIndex: number) => number[]
  loading: boolean
  loadingBeds: boolean
}

const amenitiesList = [
  "Toalla",
  "Sábanas",
  "Almohada Extra",
  "Locker",
  "WiFi Premium",
]

export function ReservationForm({
  isOpen,
  onOpenChange,
  onSaveReservation,
  isEditMode,
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
  getAvailableBedsForGuest,
  loading,
  loadingBeds,
}: ReservationFormProps) {

  const isFormValid = () => {
    return checkInDate && 
           checkOutDate && 
           guests.every(g => g.bedNumber !== null && g.name && g.lastName && g.dni)
  }
  const assignedBedsCount = guests.filter(g => g.bedNumber !== null).length

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEditMode ? "Editar Reserva" : "Nueva Reserva"}
          </DialogTitle>
        </DialogHeader>
      
    
        <div className="space-y-6 p-6">
          {/* Fechas */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-blue-900">Check-in *</Label>
                  <Input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    required
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label className="text-blue-900">Check-out *</Label>
                  <Input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate}
                    required
                    className="bg-white"
                  />
                </div>
              </div>

          {/* Mostrar camas disponibles */}
              {loadingBeds && (
                <div className="flex items-center gap-2 text-blue-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Cargando camas disponibles...</span>
                </div>
              )}

              {!loadingBeds && checkInDate && checkOutDate && availableBeds.length > 0 && (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Camas disponibles para estas fechas: {availableBeds.length}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {availableBeds.map(bed => (
                      <Badge key={bed} variant="outline" className="text-xs">
                        {bed}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {!loadingBeds && checkInDate && checkOutDate && availableBeds.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    No hay camas disponibles para estas fechas. Prueba con otras fechas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>



          {/* Número de personas */}
                <div>
            <Label>Número de personas *</Label>
            {(!checkInDate || !checkOutDate || availableBeds.length === 0) ? (
              <div className="relative">
                <Select value={guestCount.toString()} onValueChange={() => {}}>
                  <SelectTrigger className="opacity-50 cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                </Select>
                <div className="absolute inset-0 cursor-not-allowed" />
              </div>
            ) : (
              <Select value={guestCount.toString()} onValueChange={handleGuestCountChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6]
                    .filter(num => num <= availableBeds.length || availableBeds.length === 0)
                    .map((num) => (
                      <SelectItem 
                        key={num} 
                        value={num.toString()}
                      >
                        {num} {num === 1 ? "persona" : "personas"}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            )}
            {(!checkInDate || !checkOutDate) && (
              <p className="text-sm text-gray-500 mt-2">
                Primero selecciona las fechas de check-in y check-out
              </p>
            )}
            {checkInDate && checkOutDate && availableBeds.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                No hay camas disponibles para estas fechas
              </p>
            )}
            {availableBeds.length > 0 && availableBeds.length < 6 && (
              <p className="text-sm text-blue-600 mt-2">
                Máximo {availableBeds.length} {availableBeds.length === 1 ? "persona" : "personas"} (camas disponibles)
              </p>
            )}
            {assignedBedsCount < guestCount && (
              <p className="text-sm text-amber-600 mt-2">
                Debes asignar {guestCount - assignedBedsCount} cama(s) más
              </p>
            )}
          </div>

          {/* Datos de huéspedes */}
          {guests.map((guest, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    Huésped {index + 1}
                    {guest.bedNumber !== null && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Bed className="h-3 w-3" />
                        Cama {guest.bedNumber}
                      </Badge>
                    )}
                  </span>
                  {guest.name && guest.lastName && guest.dni && guest.bedNumber !== null && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selector de cama individual */}

                <div>
                  <Label>Cama asignada *</Label>
                  <Select
                    value={guest.bedNumber?.toString() || ""}
                    onValueChange={(value) => updateGuest(index, "bedNumber", parseInt(value))}
                    disabled={availableBeds.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una cama" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableBedsForGuest(index).map((bed) => (
                        <SelectItem key={bed} value={bed.toString()}>
                          <div className="flex items-center gap-2">
                            <Bed className="h-3 w-3" />
                            Cama {bed}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={guest.name}
                      onChange={(e) => updateGuest(index, "name", e.target.value)}
                      placeholder="Juan"
                      required
                    />
                  </div>
                  <div>
                    <Label>Apellido</Label>
                    <Input
                      value={guest.lastName}
                      onChange={(e) => updateGuest(index, "lastName", e.target.value)}
                      placeholder="Perez"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>DNI</Label>
                    <Input
                      value={guest.dni}
                      onChange={(e) => updateGuest(index, "dni", e.target.value)}
                      placeholder="12345678"
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={guest.email}
                      onChange={(e) => updateGuest(index, "email", e.target.value)}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Origen</Label>
                    <Input
                      value={guest.origin}
                      onChange={(e) => updateGuest(index, "origin", e.target.value)}
                      placeholder="Argentina"
                    />
                  </div>
                  <div>
                    <Label>Patente</Label>
                    <Input
                      value={guest.license}
                      onChange={(e) => updateGuest(index, "license", e.target.value)}
                      placeholder="ABC123"
                    />
                  </div>
                </div>

                <div>
                  <Label>Notas</Label>
                  <Textarea
                    value={guest.notes}
                    onChange={(e) => updateGuest(index, "notes", e.target.value)}
                    placeholder="Información adicional..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Amenities</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {amenitiesList.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          checked={guest.amenities.includes(amenity)}
                          onCheckedChange={() => toggleAmenity(index, amenity)}
                        />
                        <Label className="text-sm">{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={guest.breakfast}
                    onCheckedChange={(checked) => updateGuest(index, "breakfast", checked)}
                  />
                  <Label>Incluir desayuno</Label>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end space-x-2">
            <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}>
              Cancelar
            </Button>
            <Button 
            onClick={onSaveReservation} 
            disabled={!isFormValid() || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                isEditMode ? "Actualizar Reserva" : "Crear Reserva"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

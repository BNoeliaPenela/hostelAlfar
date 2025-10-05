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
import { Trash2 } from "lucide-react"
import type { GuestData } from "../types/reservations"

interface ReservationFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreateReservation: () => void
  selectedBed: number
  selectBed: (bedNum: number) => void
  checkInDate: string
  setCheckInDate: (date: string) => void
  checkOutDate: string
  setCheckOutDate: (date: string) => void
  guestCount: number
  handleGuestCountChange: (count: string) => void
  guests: GuestData[]
  updateGuest: (index: number, field: keyof GuestData, value: any) => void
  toggleAmenity: (guestIndex: number, amenity: string) => void
  availableBeds: number[]
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
  onCreateReservation,
  selectedBed,
  selectBed,
  checkInDate,
  setCheckInDate,
  checkOutDate,
  setCheckOutDate,
  guestCount,
  handleGuestCountChange,
  guests,
  updateGuest,
  toggleAmenity,
  availableBeds,
}: ReservationFormProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Reserva</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Check-in</Label>
              <Input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Check-out</Label>
              <Input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
            </div>
          </div>

          {/* Número de personas */}
          <div>
            <Label>Número de personas</Label>
            <Select value={guestCount.toString()} onValueChange={handleGuestCountChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Camas disponibles */}
          {availableBeds.length > 0 && (
            <div>
              <Label>Camas Disponibles</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {availableBeds.map((bedNum) => (
                  <Button
                    key={bedNum}
                    variant={selectedBed === bedNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => selectBed(bedNum)}
                  >
                    Cama {bedNum}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Datos de huéspedes */}
          {guests.map((guest, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Huésped {index + 1}
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newGuests = guests.filter((_, i) => i !== index)
                        // Actualiza estado en el hook que llama a este componente
                        // Aquí solo se emite el evento, la lógica queda afuera
                        // Por eso no se hace setGuests aquí
                        // En el hook se debe manejar esta función
                        // Para simplificar, puedes pasar una función prop para eliminar huésped
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={guest.name}
                      onChange={(e) => updateGuest(index, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Apellido</Label>
                    <Input
                      value={guest.lastName}
                      onChange={(e) => updateGuest(index, "lastName", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>DNI</Label>
                    <Input
                      value={guest.dni}
                      onChange={(e) => updateGuest(index, "dni", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={guest.email}
                      onChange={(e) => updateGuest(index, "email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Origen</Label>
                    <Input
                      value={guest.origin}
                      onChange={(e) => updateGuest(index, "origin", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Patente</Label>
                    <Input
                      value={guest.license}
                      onChange={(e) => updateGuest(index, "license", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Notas</Label>
                  <Textarea
                    value={guest.notes}
                    onChange={(e) => updateGuest(index, "notes", e.target.value)}
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onCreateReservation} >Crear Reserva</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

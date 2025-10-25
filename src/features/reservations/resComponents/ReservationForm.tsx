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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/Select"
import { Badge } from "../../../components/ui/Badge"
import { AlertCircle, Bed, Calendar, CheckCircle2, Loader2 } from "lucide-react"
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
  checkInTime: string
  setCheckInTime: (time: string) => void
  checkOutTime: string
  setCheckOutTime: (time: string) => void
  guestCount: number
  handleGuestCountChange: (count: string) => void
  guests: GuestData[]
  updateGuest: (index: number, field: keyof GuestData, value: any) => void
  availableBeds: number[]
  getAvailableBedsForGuest: (guestIndex: number) => number[]
  loading: boolean
  loadingBeds: boolean
}



export function ReservationForm({
  isOpen,
  onOpenChange,
  onSaveReservation,
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
  loading,
  loadingBeds,
}: ReservationFormProps) {
  const today = new Date()
  const timezoneOffsetMs = today.getTimezoneOffset() * 60 * 1000
  const localToday = new Date(today.getTime() - timezoneOffsetMs)
  const todayDateStr = localToday.toISOString().split('T')[0]
  const nowTimeStr = today.toTimeString().slice(0,5)
  const phoneOk = (p: string) => (p || "").replace(/\D/g, "").length >= 7
  const dniOk = (d: string) => (d || "").replace(/\D/g, "").length >= 6
  const isFormValid = () => {
    const timesOk = Boolean(checkInDate && checkOutDate && checkInTime && checkOutTime)
    const bedsOk = guests.every(g => g.bedNumber !== null) && assignedBedsCount === guestCount
    const guestsOk = guests.every(g => g.name && g.lastName && g.dni && dniOk(g.dni) && phoneOk(g.telefono) && (g as any).direccion)
    return timesOk && bedsOk && guestsOk
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
                    min={todayDateStr}
                    required
                    className="bg-white"
                  />
                  <div className="mt-2">
                    <Input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      min={checkInDate === todayDateStr ? nowTimeStr : undefined}
                      required
                      className="bg-white"
                    />
                  </div>
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
                  <div className="mt-2">
                    <Input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      min={checkOutDate === checkInDate ? checkInTime : undefined}
                      required
                      className="bg-white"
                    />
                  </div>
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
                      inputMode="numeric"
                      pattern="\\d{6,}"
                      title="Solo numeros (6+ digitos)"
                      placeholder="12345678"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Telefono</Label>
                    <Input
                      value={guest.telefono}
                      onChange={(e) => updateGuest(index, "telefono", e.target.value)}
                      inputMode="tel"
                      pattern="\\d{7,}"
                      title="Minimo 7 digitos"
                      placeholder=""
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
                </div>

                {/* Direccion */}
                <div>
                  <Label>Direccion</Label>
                  <Input
                    value={(guest as any).direccion || ""}
                    onChange={(e) => updateGuest(index, "direccion", e.target.value)}
                    placeholder="Calle 123, Ciudad"
                    required
                  />
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

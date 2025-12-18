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
  loadingBeds: boolean
  isSaving: boolean
  fieldErrors: Record<string, string>
  formError: string
  clearFieldError: (field: string) => void
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
  loadingBeds,
  isSaving,
  fieldErrors,
  formError,
  clearFieldError,
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
  const guestFieldKey = (index: number, field: string) => `guest.${index}.${field}`
  const getFieldError = (...keys: string[]) => {
    for (const key of keys) {
      const message = fieldErrors[key]
      if (message) return message
    }
    return ""
  }
  const hasFieldError = (...keys: string[]) => Boolean(getFieldError(...keys))
  const withErrorClass = (base: string, ...keys: string[]) =>
    hasFieldError(...keys) ? (base ? `${base} input-error` : "input-error") : base
  const renderFieldError = (...keys: string[]) => {
    const message = getFieldError(...keys)
    if (!message) return null
    return <p className="field-error">{message}</p>
  }
  const clearErrorFor = (...keys: string[]) => {
    keys.forEach((key) => clearFieldError(key))
  }

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
          {formError && (
            <div className="form-error" role="alert">
              {formError}
            </div>
          )}
          {/* Fechas */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-blue-900">Check-in *</Label>
                  <Input
                    name="check_in"
                    type="date"
                    value={checkInDate}
                    onChange={(e) => {
                      clearErrorFor("check_in")
                      setCheckInDate(e.target.value)
                    }}
                    min={todayDateStr}
                    required
                    className={withErrorClass("bg-white", "check_in")}
                  />
                  <div className="mt-2">
                    <Input
                      name="check_in_time"
                      type="time"
                      value={checkInTime}
                      onChange={(e) => {
                        clearErrorFor("check_in")
                        setCheckInTime(e.target.value)
                      }}
                      min={checkInDate === todayDateStr ? nowTimeStr : undefined}
                      required
                      className={withErrorClass("bg-white", "check_in")}
                    />
                  </div>
                  {renderFieldError("check_in")}
                </div>
                <div>
                  <Label className="text-blue-900">Check-out *</Label>
                  <Input
                    name="check_out"
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => {
                      clearErrorFor("check_out")
                      setCheckOutDate(e.target.value)
                    }}
                    min={checkInDate}
                    required
                    className={withErrorClass("bg-white", "check_out")}
                  />
                  <div className="mt-2">
                    <Input
                      name="check_out_time"
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => {
                        clearErrorFor("check_out")
                        setCheckOutTime(e.target.value)
                      }}
                      min={checkOutDate === checkInDate ? checkInTime : undefined}
                      required
                      className={withErrorClass("bg-white", "check_out")}
                    />
                  </div>
                  {renderFieldError("check_out")}
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
              <Select
                value={guestCount.toString()}
                onValueChange={(value) => {
                  handleGuestCountChange(value)
                }}
              >
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
                    onValueChange={(value) => {
                      clearErrorFor(guestFieldKey(index, "bed"), "camas")
                      updateGuest(index, "bedNumber", parseInt(value))
                    }}
                    disabled={availableBeds.length === 0}
                  >
                    <SelectTrigger className={withErrorClass("", guestFieldKey(index, "bed"), "camas")}>
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
                  {renderFieldError(guestFieldKey(index, "bed"), "camas")}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      name="nombre"
                      value={guest.name}
                      onChange={(e) => {
                        clearErrorFor(guestFieldKey(index, "name"), "nombre")
                        updateGuest(index, "name", e.target.value)
                      }}
                      placeholder="Juan"
                      required
                      className={withErrorClass("", guestFieldKey(index, "name"), "nombre")}
                    />
                    {renderFieldError(guestFieldKey(index, "name"), "nombre")}
                  </div>
                  <div>
                    <Label>Apellido</Label>
                    <Input
                      name="apellido"
                      value={guest.lastName}
                      onChange={(e) => {
                        clearErrorFor(guestFieldKey(index, "lastName"), "apellido")
                        updateGuest(index, "lastName", e.target.value)
                      }}
                      placeholder="Perez"
                      required
                      className={withErrorClass("", guestFieldKey(index, "lastName"), "apellido")}
                    />
                    {renderFieldError(guestFieldKey(index, "lastName"), "apellido")}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>DNI</Label>
                    <Input
                      name="dni"
                      value={guest.dni}
                      onChange={(e) => {
                        clearErrorFor(guestFieldKey(index, "dni"), "dni", "documento")
                        updateGuest(index, "dni", e.target.value)
                      }}
                      inputMode="numeric"
                      pattern="\\d{6,}"
                      title="Solo numeros (6+ digitos)"
                      placeholder="12345678"
                      required
                      className={withErrorClass("", guestFieldKey(index, "dni"), "dni", "documento")}
                    />
                    {renderFieldError(guestFieldKey(index, "dni"), "dni", "documento")}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Telefono</Label>
                    <Input
                      name="telefono"
                      value={guest.telefono}
                      onChange={(e) => {
                        clearErrorFor(guestFieldKey(index, "telefono"), "telefono")
                        updateGuest(index, "telefono", e.target.value)
                      }}
                      inputMode="tel"
                      pattern="\\d{7,}"
                      title="Minimo 7 digitos"
                      placeholder=""
                      required
                      className={withErrorClass("", guestFieldKey(index, "telefono"), "telefono")}
                    />
                    {renderFieldError(guestFieldKey(index, "telefono"), "telefono")}
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      name="email"
                      type="email"
                      value={guest.email}
                      onChange={(e) => {
                        clearErrorFor(guestFieldKey(index, "email"), "email")
                        updateGuest(index, "email", e.target.value)
                      }}
                      placeholder="email@ejemplo.com"
                      className={withErrorClass("", guestFieldKey(index, "email"), "email")}
                    />
                    {renderFieldError(guestFieldKey(index, "email"), "email")}
                  </div>
                </div>
                </div>

                {/* Direccion */}
                <div>
                  <Label>Direccion</Label>
                  <Input
                    name="direccion"
                    value={(guest as any).direccion || ""}
                    onChange={(e) => {
                      clearErrorFor(guestFieldKey(index, "direccion"), "direccion")
                      updateGuest(index, "direccion", e.target.value)
                    }}
                    placeholder="Calle 123, Ciudad"
                    required
                    className={withErrorClass("", guestFieldKey(index, "direccion"), "direccion")}
                  />
                  {renderFieldError(guestFieldKey(index, "direccion"), "direccion")}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Origen</Label>
                    <Input
                      name="origen"
                      value={guest.origin}
                      onChange={(e) => {
                        clearErrorFor("origen", "origin")
                        updateGuest(index, "origin", e.target.value)
                      }}
                      placeholder="Argentina"
                      className={withErrorClass("", "origen", "origin")}
                    />
                    {renderFieldError("origen", "origin")}
                  </div>
                  <div>
                    <Label>Patente</Label>
                    <Input
                      name="patente"
                      value={guest.license}
                      onChange={(e) => {
                        clearErrorFor(guestFieldKey(index, "license"), "patente")
                        updateGuest(index, "license", e.target.value)
                      }}
                      placeholder="ABC123"
                      className={withErrorClass("", guestFieldKey(index, "license"), "patente")}
                    />
                    {renderFieldError(guestFieldKey(index, "license"), "patente")}
                  </div>
                </div>

                <div>
                  <Label>Notas</Label>
                  <Textarea
                    name="notas"
                    value={guest.notes}
                    onChange={(e) => {
                      clearErrorFor("notas", "notes")
                      updateGuest(index, "notes", e.target.value)
                    }}
                    placeholder="Informacion adicional..."
                    rows={3}
                    className={withErrorClass("", "notas", "notes")}
                  />
                  {renderFieldError("notas", "notes")}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end space-x-2">
            <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isSaving}>
              Cancelar
            </Button>
            <Button 
            onClick={onSaveReservation} 
            disabled={!isFormValid() || isSaving}>
              {isSaving ? (
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

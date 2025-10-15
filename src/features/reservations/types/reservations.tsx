export interface reservation {
  id: number
  checkIn: Date
  checkOut: Date
  status: "activa" | "completada" | "cancelada" | "en_progreso"
  guests: number
  guestDetails: GuestData[]
  realCheckInDateTime?: Date | null  // Fecha/hora real del check-in
  realCheckOutDateTime?: Date | null  // Fecha/hora real del check-out
}
export interface GuestData {
  name: string
  lastName: string
  dni: string
  email: string
  origin: string
  license: string
  notes: string
  amenities: string[]
  breakfast: boolean
  bedNumber: number | null
}   

export interface AvailableBed {
  bedNumber: number
  isAvailable: boolean
}
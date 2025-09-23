export interface reservation {
  id: number
  guestName: string
  checkIn: Date
  checkOut: Date
  bedNumber: number
  status: "activa" | "completada" | "cancelada"
  guests: number
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
}
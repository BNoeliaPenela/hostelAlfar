import type { reservation } from "../types/reservations"
const mockReservations: reservation[] = [
  {
    id: 1,
    guestName: "Juan Pérez",
    checkIn: new Date(2024, 0, 15),
    checkOut: new Date(2024, 0, 18),
    bedNumber: 5,
    status: "activa",
    guests: 1,
  },
  {
    id: 2,
    guestName: "María García",
    checkIn: new Date(2024, 0, 16),
    checkOut: new Date(2024, 0, 20),
    bedNumber: 12,
    status: "activa",
    guests: 2,
  },
]
export function fetchReservations(): Promise<reservation[]> {
  // Simula llamada API
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockReservations), 500)
  })
}
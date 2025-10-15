import type { reservation } from "../types/reservations"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

const mockReservations: reservation[] = [
  {
    id: 1,
    checkIn: new Date(2024, 11, 15),
    checkOut: new Date(2024, 11, 18),
    status: "activa",
    guests: 2,
    guestDetails: [
      {
        name: "Juan",
        lastName: "Pérez",
        dni: "12345678",
        email: "juan@email.com",
        origin: "Argentina",
        license: "ABC123",
        notes: "",
        amenities: ["Toalla", "Sábanas"],
        breakfast: true,
        bedNumber: 5
      },
      {
        name: "María",
        lastName: "García",
        dni: "87654321",
        email: "maria@email.com",
        origin: "Chile",
        license: "",
        notes: "Alérgica a los lácteos",
        amenities: ["Toalla"],
        breakfast: true,
        bedNumber: 12
      }
    ]
  },
  {
    id: 2,
    checkIn: new Date(2024, 11, 20),
    checkOut: new Date(2024, 11, 23),
    status: "activa",
    guests: 1,
    guestDetails: [
      {
        name: "Carlos",
        lastName: "López",
        dni: "11223344",
        email: "carlos@email.com",
        origin: "Uruguay",
        license: "XYZ789",
        notes: "",
        amenities: ["Toalla", "Locker"],
        breakfast: false,
        bedNumber: 7
      }
    ]
  },
]

const ALL_BEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]

// Simula delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Flag para usar mock o API real
const USE_MOCK = true // Cambia a false cuando tengas el backend listo

export async function fetchReservations(): Promise<reservation[]> {
  // Simula llamada API
  if (USE_MOCK) {
    await delay(500)
    return mockReservations
  }

  try {
    const response = await fetch(`${API_URL}/reservations/`)
    if (!response.ok) throw new Error('Error fetching reservations')
    const data = await response.json()
    return data.map((r: any) => ({
      ...r,
      checkIn: new Date(r.checkIn),
      checkOut: new Date(r.checkOut)
    }))
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export async function fetchAvailableBeds(checkIn: string, checkOut: string): Promise<number[]> {
  if (USE_MOCK) {
    await delay(300)
    
    // Simula lógica: encuentra camas ocupadas en ese rango de fechas
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    
    const occupiedBeds = new Set<number>()
    
    mockReservations.forEach(reservation => {
      // Verifica si hay overlap de fechas
      const resCheckIn = reservation.checkIn
      const resCheckOut = reservation.checkOut
      
      const hasOverlap = (
        (checkInDate >= resCheckIn && checkInDate < resCheckOut) ||
        (checkOutDate > resCheckIn && checkOutDate <= resCheckOut) ||
        (checkInDate <= resCheckIn && checkOutDate >= resCheckOut)
      )
      
      if (hasOverlap) {
        // Marca todas las camas de esta reserva como ocupadas
        reservation.guestDetails.forEach(guest => {
          if (guest.bedNumber) {
            occupiedBeds.add(guest.bedNumber)
          }
        })
      }
    })
    
    // Devuelve solo las camas disponibles
    return ALL_BEDS.filter(bed => !occupiedBeds.has(bed))
  }

  try {
    const response = await fetch(
      `${API_URL}/beds/available/?check_in=${checkIn}&check_out=${checkOut}`
    )
    if (!response.ok) throw new Error('Error fetching available beds')
    const data = await response.json()
    return data.availableBeds || []
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export async function createReservation(reservation: Omit<reservation, 'id'>): Promise<reservation> {
  if (USE_MOCK) {
    await delay(300)
    const newReservation = {
      ...reservation,
      id: Math.max(...mockReservations.map(r => r.id), 0) + 1
    }
    mockReservations.push(newReservation)
    return newReservation
  }

  try {
    const response = await fetch(`${API_URL}/reservations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...reservation,
        checkIn: reservation.checkIn.toISOString(),
        checkOut: reservation.checkOut.toISOString()
      })
    })
    if (!response.ok) throw new Error('Error creating reservation')
    const data = await response.json()
    return {
      ...data,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut)
    }
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export async function updateReservation(id: number, reservation: reservation): Promise<reservation> {
  //usando mock
  if (USE_MOCK) {
    await delay(300)
    const index = mockReservations.findIndex(r => r.id === id)
    if (index !== -1) {
      mockReservations[index] = reservation
    }
    return reservation
  }
  //usando API real
  try {
    const response = await fetch(`${API_URL}/reservations/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...reservation,
        checkIn: reservation.checkIn.toISOString(),
        checkOut: reservation.checkOut.toISOString()
      })
    })
    if (!response.ok) throw new Error('Error updating reservation')
    const data = await response.json()
    return {
      ...data,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut)
    }
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export async function deleteReservation(id: number): Promise<void> {
  if (USE_MOCK) {
    await delay(300)
    const index = mockReservations.findIndex(r => r.id === id)
    if (index !== -1) {
      mockReservations.splice(index, 1)
    }
    return
  }

  try {
    const response = await fetch(`${API_URL}/reservations/${id}/`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Error deleting reservation')
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

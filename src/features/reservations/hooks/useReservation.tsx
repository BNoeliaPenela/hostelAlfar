import { useState, useEffect } from "react"
import type { reservation, GuestData } from "../types/reservations"
import { fetchReservations } from "../services/reservationService"

export function useReservations() {
  const [reservations, setReservations] = useState<reservation[]>([])
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false)
  const [checkInDate, setCheckInDate] = useState("")
  const [checkOutDate, setCheckOutDate] = useState("")
  const [guestCount, setGuestCount] = useState(1)
  const [guests, setGuests] = useState<GuestData[]>([
    {
      name: "",
      lastName: "",
      dni: "",
      email: "",
      origin: "",
      license: "",
      notes: "",
      amenities: [],
      breakfast: false,
    },
  ])
  const [availableBeds] = useState<number[]>([1, 3, 7, 9, 11, 15, 18, 21, 23])

  // Nuevo método para agregar una reserva
  const addReservation = (reservation: reservation) => {
  setReservations(prev => [...prev, { ...reservation, id: Date.now() }]);
  };

  useEffect(() => {
    fetchReservations().then(setReservations)
  }, [])

  const handleGuestCountChange = (count: string) => {
    const num = Number.parseInt(count)
    setGuestCount(num)
    const newGuests = Array(num)
      .fill(null)
      .map(
        (_, index) =>
          guests[index] || {
            name: "",
            lastName: "",
            dni: "",
            email: "",
            origin: "",
            license: "",
            notes: "",
            amenities: [],
            breakfast: false,
          },
      )
    setGuests(newGuests)
  }

  const updateGuest = (index: number, field: keyof GuestData, value: any) => {
    const updatedGuests = [...guests]
    updatedGuests[index] = { ...updatedGuests[index], [field]: value }
    setGuests(updatedGuests)
  }

  const toggleAmenity = (guestIndex: number, amenity: string) => {
    const updatedGuests = [...guests]
    const currentAmenities = updatedGuests[guestIndex].amenities
    if (currentAmenities.includes(amenity)) {
      updatedGuests[guestIndex].amenities = currentAmenities.filter((a) => a !== amenity)
    } else {
      updatedGuests[guestIndex].amenities = [...currentAmenities, amenity]
    }
    setGuests(updatedGuests)
  }

  return {
    reservations,
    isNewReservationOpen,
    setIsNewReservationOpen,
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
    addReservation,
  }
}

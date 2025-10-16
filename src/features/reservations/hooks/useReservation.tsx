import { useState, useEffect } from "react"
import type { reservation, GuestData } from "../types/reservations"
import { 
  fetchReservations, 
  createReservation, 
  updateReservation, 
  deleteReservation,
  fetchAvailableBeds } from "../services/reservationService"

export function useReservations() {
  const [reservations, setReservations] = useState<reservation[]>([])
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingReservationId, setEditingReservationId] = useState<number | null>(null)
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
      bedNumber: null,
    },
  ])
  const [availableBeds, setAvailableBeds] = useState<number[]>([1, 3, 7, 9, 11, 15, 18, 21, 23])
  const [loading, setLoading] = useState(false)
  const [loadingBeds, setLoadingBeds] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingReservation, setEditingReservation] = useState<reservation | null>(null)  // Guarda la reserva original
  /*const [selectedBed, setSelectedBed] = useState<number>(0);
  const selectBed = (bedNum: number) => setSelectedBed(bedNum);
  // Nuevo método para agregar una reserva
  const addReservation = (reservation: reservation) => {
  setReservations(prev => [...prev, { ...reservation, id: Date.now() }]);
  };*/

  useEffect(() => {
    loadReservations()
  }, [])

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      loadAvailableBeds()
    } else {
      setAvailableBeds([])
    }
  }, [checkInDate, checkOutDate])

  const loadReservations = async () => {
    setLoading(true)
    try {
      const data = await fetchReservations()
      setReservations(data)
    } catch (error) {
      console.error("Error cargando reservas:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableBeds = async () => {
    if (!checkInDate || !checkOutDate) return
    
    setLoadingBeds(true)
    try {
      const beds = await fetchAvailableBeds(checkInDate, checkOutDate)
      //setAvailableBeds(beds)
      //cambio 12/10
      // Si hay huéspedes con camas ya asignadas que ya no están disponibles, las limpiamos
      // Si estamos editando, agregar las camas actuales de la reserva
      let availableBedsWithCurrent = [...beds]
      if (isEditMode && editingReservation) {
        const currentBeds = editingReservation.guestDetails
          .map(g => g.bedNumber)
          .filter((bed): bed is number => bed !== null)
        
        // Agregar camas actuales que no estén ya en disponibles
        currentBeds.forEach(bed => {
          if (!availableBedsWithCurrent.includes(bed)) {
            availableBedsWithCurrent.push(bed)
          }
        })
        
        // Ordenar
        availableBedsWithCurrent.sort((a, b) => a - b)
      }
      setAvailableBeds(availableBedsWithCurrent)
      
      if (!isEditMode) {
        const updatedGuests = guests.map(guest => {
        if (guest.bedNumber && !availableBedsWithCurrent.includes(guest.bedNumber)) {
          return { ...guest, bedNumber: null }
        }
        return guest
        })
        setGuests(updatedGuests)}
      
    } catch (error) {
      console.error("Error cargando camas disponibles:", error)
    } finally {
      setLoadingBeds(false)
    }
    
  }

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
            bedNumber: null,
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

  // Devuelve las camas disponibles para un huésped específico
  // (excluye las ya seleccionadas por otros huéspedes)
  const getAvailableBedsForGuest = (guestIndex: number): number[] => {
    const selectedBeds = guests
      .map((g, idx) => idx !== guestIndex ? g.bedNumber : null)
      .filter((bed): bed is number => bed !== null)
    
    return availableBeds.filter(bed => !selectedBeds.includes(bed))
  }

  const resetForm = () => {
    setIsEditMode(false)
    setEditingReservationId(null)
    setCheckInDate("")
    setCheckOutDate("")
    setGuestCount(1)
    setGuests([{
      name: "",
      lastName: "",
      dni: "",
      email: "",
      origin: "",
      license: "",
      notes: "",
      amenities: [],
      breakfast: false,
      bedNumber: null,
    }])
    setAvailableBeds([])
  }

  const addReservation = async () => {
     // Previene doble click/guardado
    if (isSaving) {
      console.log('Ya se está guardando, ignorando...')
      return
    }

    // Validaciones
    if (!checkInDate || !checkOutDate) {
      alert("Por favor selecciona las fechas de check-in y check-out")
      return
    }

    const hasAllBeds = guests.every(g => g.bedNumber !== null)
    if (!hasAllBeds) {
      alert("Por favor asigna una cama a cada huésped")
      return
    }

    const hasBasicInfo = guests.every(g => g.name && g.lastName && g.dni)
    if (!hasBasicInfo) {
      alert("Por favor completa nombre, apellido y DNI de cada huésped")
      return
    }

    const newReservation: Omit<reservation, 'id'> = {
      checkIn: new Date(checkInDate),
      checkOut: new Date(checkOutDate),
      status: "activa",
      guests: guestCount,
      guestDetails: guests
    }

    setLoading(true)
    setIsSaving(true)
    try {
      //const created = 
      await createReservation(newReservation)
      //setReservations(prev => [...prev, created])
      await loadReservations() // recarga desde el mock actualizado
      resetForm()
      setIsNewReservationOpen(false)
    } catch (error) {
      console.error("Error creando reserva:", error)
      alert("Error al crear la reserva")
    } finally {
      setLoading(false)
      setIsSaving(false)
    }
  }

  const editReservation = async () => {
    if (!editingReservationId) return

    // Validaciones
    if (!checkInDate || !checkOutDate) {
      alert("Por favor selecciona las fechas de check-in y check-out")
      return
    }

    const hasAllBeds = guests.every(g => g.bedNumber !== null)
    if (!hasAllBeds) {
      alert("Por favor asigna una cama a cada huésped")
      return
    }

    const hasBasicInfo = guests.every(g => g.name && g.lastName && g.dni)
    if (!hasBasicInfo) {
      alert("Por favor completa nombre, apellido y DNI de cada huésped")
      return
    }

    const updatedReservation: reservation = {
      id: editingReservationId,
      checkIn: new Date(checkInDate),
      checkOut: new Date(checkOutDate),
      status: "activa",
      guests: guestCount,
      guestDetails: guests
    }

    setLoading(true)
    try {
      const updated = await updateReservation(editingReservationId, updatedReservation)
      setReservations(prev => prev.map(r => r.id === editingReservationId ? updated : r))
      resetForm()
      setIsNewReservationOpen(false)
    } catch (error) {
      console.error("Error actualizando reserva:", error)
      alert("Error al actualizar la reserva")
    } finally {
      setLoading(false)
    }
  }

  const removeReservation = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta reserva?")) {
      return
    }

    setLoading(true)
    try {
      await deleteReservation(id)
      setReservations(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error("Error eliminando reserva:", error)
      alert("Error al eliminar la reserva")
    } finally {
      setLoading(false)
    }
  }
  
  const openEditReservation = (reservation: reservation) => {
    setIsEditMode(true)
    setEditingReservationId(reservation.id)
    setEditingReservation(reservation)  // Guarda la reserva original
    setCheckInDate(reservation.checkIn.toISOString().split('T')[0])
    setCheckOutDate(reservation.checkOut.toISOString().split('T')[0])
    setGuestCount(reservation.guests)
    setGuests(reservation.guestDetails)
    setIsNewReservationOpen(true)
  }

  const handleSaveReservation = () => {
    if (isEditMode) {
      editReservation()
    } else {
      addReservation()
    }
  }

  const handleCheckIn = async (id: number) => {
    const reservation = reservations.find(r => r.id === id)
    if (!reservation) return

    if (!confirm("¿Confirmar check-in para esta reserva?")) {
      return
    }

    setLoading(true)
    try {
      const updatedReservation: reservation = {
        ...reservation,
        status: "en_progreso",
        realCheckInDateTime: new Date()
      }
      
      const updated = await updateReservation(id, updatedReservation)
      setReservations(prev => prev.map(r => r.id === id ? updated : r))
    } catch (error) {
      console.error("Error en check-in:", error)
      alert("Error al realizar check-in")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async (id: number) => {
    const reservation = reservations.find(r => r.id === id)
    if (!reservation) return

    if (!confirm("¿Confirmar check-out para esta reserva?")) {
      return
    }

    setLoading(true)
    try {
      const updatedReservation: reservation = {
        ...reservation,
        status: "completada",
        realCheckOutDateTime: new Date()
      }
      
      const updated = await updateReservation(id, updatedReservation)
      setReservations(prev => prev.map(r => r.id === id ? updated : r))
    } catch (error) {
      console.error("Error en check-out:", error)
      alert("Error al realizar check-out")
    } finally {
      setLoading(false)
    }
  }
  return {
    reservations,
    isNewReservationOpen,
    setIsNewReservationOpen,
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
    availableBeds,
    getAvailableBedsForGuest,
    handleSaveReservation,
    removeReservation,
    openEditReservation,
    resetForm,
    loading,
    loadingBeds,
    handleCheckIn,
    handleCheckOut,
    

  }
}

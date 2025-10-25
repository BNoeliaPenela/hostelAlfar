import { useState, useEffect } from "react"
import type { reservation, GuestData } from "../types/reservations"
import { 
  fetchReservations, 
  createReservation, 
  updateReservation, 
  deleteReservation,
  fetchAvailableBeds,
  checkInReservation,
  checkOutReservation,
  noShowReservation,
  checkExtensionAvailability,
  extendReservation,
} from "../services/reservationService"

export function useReservations() {
  const [reservations, setReservations] = useState<reservation[]>([])
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingReservationId, setEditingReservationId] = useState<number | null>(null)
  const [checkInDate, setCheckInDate] = useState("")
  const [checkOutDate, setCheckOutDate] = useState("")
  const [checkInTime, setCheckInTime] = useState("")
  const [checkOutTime, setCheckOutTime] = useState("")
  const [guestCount, setGuestCount] = useState(1)
  const [guests, setGuests] = useState<GuestData[]>([
    {
      name: "",
      lastName: "",
      dni: "",
      email: "",
      telefono: "",
      direccion: "",
      origin: "",
      license: "",
      notes: "",
      breakfast: false,
      bedNumber: null,
    },
  ])
  const [availableBeds, setAvailableBeds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBeds, setLoadingBeds] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingReservation, setEditingReservation] = useState<reservation | null>(null)  // Guarda la reserva original
  const [snoozedUntil, setSnoozedUntil] = useState<Map<number, number>>(new Map())
  /*const [selectedBed, setSelectedBed] = useState<number>(0);
  const selectBed = (bedNum: number) => setSelectedBed(bedNum);
  // Nuevo mÃ©todo para agregar una reserva
  const addReservation = (reservation: reservation) => {
  setReservations(prev => [...prev, { ...reservation, id: Date.now() }]);
  };*/

  useEffect(() => {
    loadReservations()
  }, [])

  // Recalcula listas cada 60s (sin abrir popups)
  useEffect(() => {
    const timer = setInterval(() => setReservations((prev) => [...prev]), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (checkInDate && checkOutDate && checkInTime && checkOutTime) {
      loadAvailableBeds()
    } else {
      setAvailableBeds([])
    }
  }, [checkInDate, checkOutDate, checkInTime, checkOutTime])

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

  // Listas derivadas para UI (pendientes / listos)
  const nowTs = Date.now()
  const fifteenMinMs = 15 * 60 * 1000
  const pendingCheckins = reservations.filter(r => {
    // Pendiente si aún no hizo check-in real y está cerca o pasado del horario
    if (r.realCheckInDateTime) return false
    if (!(r.status === 'activa' || r.status === 'en_progreso')) return false
    const until = snoozedUntil.get(r.id)
    if (until && until > nowTs) return false
    return r.checkIn.getTime() <= nowTs + fifteenMinMs
  })
  const overdueCheckins = pendingCheckins.filter(r => r.checkIn.getTime() < nowTs)
  const readyCheckouts = reservations.filter(r => {
    if (r.status !== 'en_progreso') return false
    const started = r.realCheckInDateTime?.getTime()
    if (!started) return false
    return nowTs >= (started + 60 * 60 * 1000)
  })

  const loadAvailableBeds = async () => {
    if (!checkInDate || !checkOutDate || !checkInTime || !checkOutTime) return
    
    setLoadingBeds(true)
    try {
      const ci = `${checkInDate} ${checkInTime}`
      const co = `${checkOutDate} ${checkOutTime}`
      const beds = await fetchAvailableBeds(ci, co)
      //setAvailableBeds(beds)
      //cambio 12/10
      // Si hay huÃ©spedes con camas ya asignadas que ya no estÃ¡n disponibles, las limpiamos
      // Si estamos editando, agregar las camas actuales de la reserva
      const availableBedsWithCurrent = [...beds]
      if (isEditMode && editingReservation) {
        const currentBeds = editingReservation.guestDetails
          .map(g => g.bedNumber)
          .filter((bed): bed is number => bed !== null)
        
        // Agregar camas actuales que no estÃ©n ya en disponibles
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
            telefono: "",
      direccion: "",
      origin: "",
            license: "",
            notes: "",
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

  // Devuelve las camas disponibles para un huÃ©sped especÃ­fico
  // (excluye las ya seleccionadas por otros huÃ©spedes)
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
      telefono: "",
      direccion: "",
      origin: "",
      license: "",
      notes: "",
      breakfast: false,
      bedNumber: null,
    }])
    setAvailableBeds([])
  }

  const addReservation = async () => {
     // Previene doble click/guardado
    if (isSaving) {
      console.log('Ya se estÃ¡ guardando, ignorando...')
      return
    }

    // Validaciones
    if (!checkInDate || !checkOutDate || !checkInTime || !checkOutTime) {
      alert("Por favor selecciona fecha y hora de check-in y check-out")
      return
    }

    const hasAllBeds = guests.every(g => g.bedNumber !== null)
    if (!hasAllBeds) {
      alert("Por favor asigna una cama a cada huÃ©sped")
      return
    }

    const phoneOk = (p: string) => (p || "").replace(/\D/g, "").length >= 7;    const hasBasicInfo = guests.every(g => g.name && g.lastName && g.dni && phoneOk(g.telefono) && (g as any).direccion)
    if (!hasBasicInfo) {
      alert("Por favor completa nombre, apellido, DNI y teléfono válido (mín. 7 dígitos) de cada huésped")
      return
    }

    const newReservation: Omit<reservation, 'id'> = {
      checkIn: new Date(`${checkInDate}T${checkInTime}:00`),
      checkOut: new Date(`${checkOutDate}T${checkOutTime}:00`),
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
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
      resetForm()
      setIsNewReservationOpen(false)
    } catch (error) {
      console.error("Error creando reserva:", error)
      alert((error as any)?.message || "Error al crear la reserva")
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
      alert("Por favor asigna una cama a cada huÃ©sped")
      return
    }

    const phoneOk = (p: string) => (p || "").replace(/\D/g, "").length >= 7;    const hasBasicInfo = guests.every(g => g.name && g.lastName && g.dni && phoneOk(g.telefono) && (g as any).direccion)
    if (!hasBasicInfo) {
      alert("Por favor completa nombre, apellido, DNI y teléfono válido (mín. 7 dígitos) de cada huésped")
      return
    }

    const updatedReservation: reservation = {
      id: editingReservationId,
      checkIn: new Date(`${checkInDate}T${checkInTime}:00`),
      checkOut: new Date(`${checkOutDate}T${checkOutTime}:00`),
      status: "activa",
      guests: guestCount,
      guestDetails: guests
    }

    setLoading(true)
    try {
      const updated = await updateReservation(editingReservationId, updatedReservation)
      setReservations(prev => prev.map(r => r.id === editingReservationId ? updated : r))
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
      resetForm()
      setIsNewReservationOpen(false)
    } catch (error) {
      console.error("Error actualizando reserva:", error)
      alert((error as any)?.message || "Error al actualizar la reserva")
    } finally {
      setLoading(false)
    }
  }

  const removeReservation = async (id: number) => {
    if (!confirm("Â¿EstÃ¡s seguro de eliminar esta reserva?")) {
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
    setCheckInTime(reservation.checkIn.toTimeString().slice(0,5))
    setCheckOutTime(reservation.checkOut.toTimeString().slice(0,5))
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

    const now = new Date()
    const scheduled = reservation.checkIn
    if (now.getTime() < scheduled.getTime()) {
      const mins = Math.max(0, Math.round((scheduled.getTime() - now.getTime()) / 60000))
      const proceed = window.confirm(`EstÃ¡s adelantando el check-in ${mins} min antes de lo programado. Â¿Deseas continuar?`)
      if (!proceed) return
    } else {
      if (!confirm("Â¿Confirmar check-in para esta reserva?")) {
        return
      }
    }

    setLoading(true)
    try {
      await checkInReservation(id, new Date())
      await loadReservations()
      // Solicita refrescar estado de camas si la vista de camas estÃ¡ abierta
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
    } catch (error) {
      console.error("Error en check-in:", error)
      alert("Error al realizar check-in")
    } finally {
      setLoading(false)
    }
  }

  // Acciones rÃ¡pidas para bandeja
  const quickCheckIn = async (id: number) => {
    setLoading(true)
    try {
      await checkInReservation(id, new Date())
      await loadReservations()
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
    } finally {
      setLoading(false)
    }
  }

  const bulkCheckIn = async (ids: number[]) => {
    setLoading(true)
    try {
      for (const id of ids) {
        try { await checkInReservation(id, new Date()) } catch {}
      }
      await loadReservations()
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
    } finally {
      setLoading(false)
    }
  }

  const markNoShow = async (id: number) => {
    setLoading(true)
    try {
      await noShowReservation(id)
      await loadReservations()
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
    } finally {
      setLoading(false)
    }
  }

  const snoozeReservation = (id: number, minutes: number) => {
    setSnoozedUntil((prev) => {
      const next = new Map(prev)
      next.set(id, Date.now() + minutes * 60 * 1000)
      return next
    })
  }

  const handleCheckOut = async (id: number) => {
    const reservation = reservations.find(r => r.id === id)
    if (!reservation) return

    const now = new Date()
    const scheduledOut = reservation.checkOut
    const realIn = reservation.realCheckInDateTime || null
    // Regla backend: estadÃ­a mÃ­nima 1h desde check-in real
    if (realIn) {
      const diffMs = now.getTime() - realIn.getTime()
      if (diffMs < 60 * 60 * 1000) {
        alert("No se puede realizar el check-out: la estadÃ­a mÃ­nima es de 1 hora desde el check-in.")
        return
      }
    }

    if (now.getTime() < scheduledOut.getTime()) {
      const mins = Math.max(0, Math.round((scheduledOut.getTime() - now.getTime()) / 60000))
      const proceed = window.confirm(`EstÃ¡s adelantando el check-out ${mins} min antes de lo programado. Â¿Deseas continuar?`)
      if (!proceed) return
    } else {
      if (!confirm("Â¿Confirmar check-out para esta reserva?")) {
        return
      }
    }

    setLoading(true)
    try {
      // Deja que el backend use el "now" por defecto (sin enviar fecha)
      await checkOutReservation(id)
      await loadReservations()
      // Tras checkout, las camas quedan PARA_LIMPIAR -> refrescar listado de camas
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
    } catch (error) {
      console.error("Error en check-out:", error)
      // Fallback: recargar y verificar si el backend igualmente marcÃ³ checkout
      try {
        const fresh = await fetchReservations()
        setReservations(fresh)
        const updated = fresh.find(r => r.id === id)
        if (updated && (updated.status === 'completada' || updated.realCheckOutDateTime)) {
          try { window.dispatchEvent(new Event('beds:reload')) } catch {}
          return
        }
      } catch {}
      const anyErr: any = error as any
      const msg = anyErr?.response?.data?.error || anyErr?.response?.data?.message || anyErr?.message || 'Error al realizar check-out'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  const parseLocalDateTime = (value: string): Date | null => {
    const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/)
    if (!m) return null
    const [_, y, mo, d, h, mi] = m
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi))
  }

  const handleExtendReservation = async (id: number) => {
    const r = reservations.find(rr => rr.id === id)
    if (!r) return
    const input = window.prompt("Nueva fecha/hora de check-out (YYYY-MM-DD HH:MM)", `${r.checkOut.getFullYear()}-${String(r.checkOut.getMonth()+1).padStart(2,'0')}-${String(r.checkOut.getDate()).padStart(2,'0')} ${String(r.checkOut.getHours()).padStart(2,'0')}:${String(r.checkOut.getMinutes()).padStart(2,'0')}`)
    if (!input) return
    const newDt = parseLocalDateTime(input)
    if (!newDt) { alert("Formato invÃ¡lido. Usa YYYY-MM-DD HH:MM"); return }
    if (newDt.getTime() <= r.checkIn.getTime()) { alert("El check-out debe ser posterior al check-in"); return }

    setLoading(true)
    try {
      const availability = await checkExtensionAvailability(r, newDt)
      if (!availability.ok) {
        const lacking = availability.unavailableBeds.join(', ')
        const alt = availability.alternatives.slice(0, 10).join(', ')
        const proceed = window.confirm(`Las camas actuales no estÃ¡n libres hasta esa fecha. No disponibles: ${lacking}.\nAlternativas: ${alt || '-'}\n\nÂ¿Abrir ediciÃ³n para reasignar camas?`)
        if (proceed) openEditReservation({ ...r, checkOut: newDt })
        return
      }
      await extendReservation(id, newDt)
      await loadReservations()
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
      alert("Reserva extendida")
    } catch (e) {
      console.error("Error extendiendo reserva:", e)
      alert("No se pudo extender la reserva")
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
    handleSaveReservation,
    removeReservation,
    openEditReservation,
    resetForm,
    loading,
    loadingBeds,
    handleCheckIn,
    handleCheckOut,
    handleExtendReservation,
    pendingCheckins,
    overdueCheckins,
    readyCheckouts,
    quickCheckIn,
    bulkCheckIn,
    markNoShow,
    snoozeReservation,
    

  }
}



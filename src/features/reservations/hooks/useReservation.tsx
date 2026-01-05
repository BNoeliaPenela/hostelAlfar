import { useState, useEffect } from "react"
import type { reservation, GuestData } from "../types/reservations"
import { 
  fetchReservations, 
  fetchActiveReservations,
  fetchReservationById,
  createReservation, 
  updateReservation, 
  deleteReservation,
  fetchAvailableBeds,
  checkInReservation,
  checkOutReservation,
  noShowReservation,
  extendStayRequest,
} from "../services/reservationService"


type CheckInWarning = {
  reservationId: number
  minutesEarly: number
  scheduledAt: Date
}

export function useReservations() {
  const [reservations, setReservations] = useState<reservation[]>([])
  const [listError, setListError] = useState<string | null>(null)
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
  const [checkInWarning, setCheckInWarning] = useState<CheckInWarning | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
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
    if (!checkInWarning) return
    const timer = window.setTimeout(() => setCheckInWarning(null), 6000)
    return () => window.clearTimeout(timer)
  }, [checkInWarning])

  useEffect(() => {
    if (!isNewReservationOpen) {
      setFieldErrors({})
      setFormError("")
    }
  }, [isNewReservationOpen])

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

  const loadReservations = async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true)
    setListError(null)
    try {
      const data = await fetchActiveReservations()
      setReservations(data)
    } catch (error) {
      console.error("Error cargando reservas:", error)
      const anyErr: any = error as any
      const msg = anyErr?.response?.data?.detail || anyErr?.message || "No se pudieron cargar las reservas activas."
      setListError(msg)
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }

  const dismissCheckInWarning = () => setCheckInWarning(null)

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const normalizeBackendErrors = (data: any) => {
    const errors: Record<string, string> = {}
    let general = ""
    if (data && typeof data === "object") {
      Object.entries(data).forEach(([key, value]) => {
        const text = Array.isArray(value)
          ? value.filter(Boolean).join(" / ")
          : typeof value === "string"
          ? value
          : ""
        if (!text) return
        if (key === "detail" || key === "non_field_errors") {
          general = general ? `${general} / ${text}` : text
        } else {
          errors[key] = text
        }
      })
    }
    return { errors, general }
  }

  const handleFormSubmitError = (error: any, fallbackMessage: string) => {
    const status = error?.response?.status
    const data = error?.response?.data
    if (status === 400 && data) {
      const { errors, general } = normalizeBackendErrors(data)
      setFieldErrors(errors)
      if (general) {
        setFormError(general)
      } else if (Object.keys(errors).length > 0) {
        setFormError("Revisa los campos marcados.")
      } else {
        setFormError(fallbackMessage)
      }
      return
    }
    const message = error?.message || fallbackMessage
    setFormError(message)
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const patenteRegex = /^(?:[A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/i
  const digitsCount = (value: string, min: number) => (value || "").replace(/\D/g, "").length >= min
  const guestFieldKey = (index: number, field: string) => `guest.${index}.${field}`

  const validateReservationInput = () => {
    const nextErrors: Record<string, string> = {}
    const generalMessages: string[] = []
    const addError = (key: string, message: string) => {
      if (!key || nextErrors[key]) return
      nextErrors[key] = message
    }
    const addGeneralMessage = (message: string) => {
      if (!generalMessages.includes(message)) generalMessages.push(message)
    }

    if (!checkInDate || !checkOutDate || !checkInTime || !checkOutTime) {
      addError("check_in", "Por favor selecciona fecha y hora de check-in y check-out")
      addError("check_out", "Por favor selecciona fecha y hora de check-in y check-out")
      addGeneralMessage("Completa las fechas para continuar.")
    } else {
      const tentativeCheckIn = new Date(`${checkInDate}T${checkInTime}:00`)
      const tentativeCheckOut = new Date(`${checkOutDate}T${checkOutTime}:00`)
      if (Number.isNaN(tentativeCheckIn.getTime()) || Number.isNaN(tentativeCheckOut.getTime())) {
        addError("check_out", "Fechas inválidas")
        addGeneralMessage("Las fechas ingresadas no son válidas.")
      } else if (tentativeCheckOut.getTime() <= tentativeCheckIn.getTime()) {
        addError("check_out", "El check-out debe ser posterior al check-in")
        addGeneralMessage("El check-out debe ser posterior al check-in.")
      }
    }

    guests.forEach((guest, index) => {
      if (guest.bedNumber === null) {
        addError(guestFieldKey(index, "bed"), "Selecciona una cama")
        addError("camas", "Por favor asigna una cama a cada huésped")
      }
      if (!guest.name.trim()) {
        addError(guestFieldKey(index, "name"), "Nombre requerido")
      }
      if (!guest.lastName.trim()) {
        addError(guestFieldKey(index, "lastName"), "Apellido requerido")
      }
      if (!digitsCount(guest.dni, 6)) {
        addError(guestFieldKey(index, "dni"), "DNI inválido (mín. 6 dígitos)")
      }
      if (!digitsCount(guest.telefono, 7)) {
        addError(guestFieldKey(index, "telefono"), "Teléfono inválido (mín. 7 dígitos)")
      }
      if (!(guest as any).direccion?.trim()) {
        addError(guestFieldKey(index, "direccion"), "Dirección requerida")
      }
      const email = guest.email?.trim()
      if (email && !emailRegex.test(email)) {
        addError(guestFieldKey(index, "email"), "Email inválido")
      }
      const patente = guest.license?.trim()
      if (patente && !patenteRegex.test(patente.replace(/-/g, ""))) {
        addError(guestFieldKey(index, "license"), "Formato de patente inválido (ABC123 o AB123CD)")
      }
    })

    const hasErrors = Object.keys(nextErrors).length > 0 || generalMessages.length > 0
    setFieldErrors(nextErrors)
    if (!hasErrors) {
      setFormError("")
      return true
    }
    if (generalMessages.length === 0 && Object.keys(nextErrors).length > 0) {
      setFormError("Revisa los campos marcados.")
    } else {
      setFormError(generalMessages.join(" "))
    }
    return false
  }

  // Listas derivadas para UI (pendientes / listos)
  const nowTs = Date.now()
  const pendingCheckins = reservations.filter(r => {
    // Pendiente si aún no hizo check-in real y está cerca o pasado del horario
    if (r.realCheckInDateTime) return false
    if (r.status !== 'activa') return false
    const until = snoozedUntil.get(r.id)
    if (until && until > nowTs) return false
    return r.checkIn.getTime() <= nowTs
  })
  const overdueCheckins = pendingCheckins
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
      // Si hay huéspedes con camas ya asignadas que ya no están disponibles, las limpiamos
      // Si estamos editando, agregar las camas actuales de la reserva
      const availableBedsWithCurrent = [...beds]
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
      telefono: "",
      direccion: "",
      origin: "",
      license: "",
      notes: "",
      breakfast: false,
      bedNumber: null,
    }])
    setAvailableBeds([])
    setFieldErrors({})
    setFormError("")
  }

  const addReservation = async () => {
    if (isSaving) {
      console.log('Ya se esta guardando, ignorando...')
      return
    }

    if (!validateReservationInput()) {
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
      await createReservation(newReservation)
      await loadReservations({ silent: true })
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
      try { window.dispatchEvent(new Event('reservations:futureReload')) } catch {}
      try { window.dispatchEvent(new Event('reservations:futureReload')) } catch {}
      resetForm()
      setIsNewReservationOpen(false)
    } catch (error) {
      console.error("Error creando reserva:", error)
      handleFormSubmitError(error, "No se pudo crear la reserva. Intenta nuevamente.")
    } finally {
      setLoading(false)
      setIsSaving(false)
    }
  }

  const editReservation = async () => {
    if (!editingReservationId) return
    if (isSaving) {
      console.log('Ya se esta guardando, ignorando...')
      return
    }

    if (!validateReservationInput()) {
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
    setIsSaving(true)
    try {
      const updated = await updateReservation(editingReservationId, updatedReservation)
      setReservations(prev => prev.map(r => r.id === editingReservationId ? updated : r))
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
      try { window.dispatchEvent(new Event('reservations:futureReload')) } catch {}
      resetForm()
      setIsNewReservationOpen(false)
    } catch (error) {
      console.error('Error actualizando reserva:', error)
      handleFormSubmitError(error, "No se pudo actualizar la reserva. Intenta nuevamente.")
    } finally {
      setLoading(false)
      setIsSaving(false)
    }
  }

  const removeReservation = async (id: number) => {
    setLoading(true)
    try {
      await deleteReservation(id)
      await loadReservations({ silent: true })
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
      try { window.dispatchEvent(new Event('reservations:futureReload')) } catch {}
    } catch (error) {
      console.error("Error eliminando reserva:", error)
      setFormError("Error al eliminar la reserva")
    } finally {
      setLoading(false)
    }
  }

  const openEditReservation = (reservation: reservation) => {
    setIsEditMode(true)
    setEditingReservationId(reservation.id)
    setEditingReservation(reservation)
    setFieldErrors({})
    setFormError("")
    setCheckInDate(reservation.checkIn.toISOString().split('T')[0])
    setCheckOutDate(reservation.checkOut.toISOString().split('T')[0])
    setCheckInTime(reservation.checkIn.toTimeString().slice(0, 5))
    setCheckOutTime(reservation.checkOut.toTimeString().slice(0, 5))
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
    let reservation = reservations.find((r) => r.id === id)
    if (!reservation) {
      try {
        reservation = await fetchReservationById(id)
      } catch (error) {
        const anyErr: any = error as any
        const msg =
          anyErr?.response?.data?.detail ||
          anyErr?.response?.data?.error ||
          anyErr?.response?.data?.message ||
          anyErr?.message ||
          "No se pudo cargar la reserva para hacer check-in."
        throw new Error(msg)
      }
    }

    const now = new Date()
    const scheduled = reservation.checkIn
    const isEarly = now.getTime() < scheduled.getTime()
    const minutesEarly = isEarly
      ? Math.max(0, Math.round((scheduled.getTime() - now.getTime()) / 60000))
      : 0
    const earlyNotice = isEarly
      ? {
          reservationId: reservation.id,
          minutesEarly,
          scheduledAt: scheduled,
        }
      : null

    try {
      await checkInReservation(id, new Date())
      await loadReservations({ silent: true })
      // Solicita refrescar estado de camas si la vista de camas está abierta
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
      try { window.dispatchEvent(new Event('reservations:futureReload')) } catch {}
      if (earlyNotice) {
        setCheckInWarning(earlyNotice)
      }
    } catch (error) {
      console.error("Error en check-in:", error)
      const anyErr: any = error as any
      const msg =
        anyErr?.response?.data?.detail ||
        anyErr?.response?.data?.error ||
        anyErr?.response?.data?.message ||
        anyErr?.message ||
        "Error al realizar check-in"
      throw new Error(msg)
    }
  }

  // Acciones rápidas para bandeja
  const quickCheckIn = async (id: number) => {
    setLoading(true)
    try {
      await checkInReservation(id, new Date())
      await loadReservations({ silent: true })
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
      await loadReservations({ silent: true })
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
    } finally {
      setLoading(false)
    }
  }

  const markNoShow = async (id: number) => {
    setLoading(true)
    try {
      await noShowReservation(id)
      await loadReservations({ silent: true })
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
    const realIn = reservation.realCheckInDateTime || null
    // Regla backend: estadía mínima 1h desde check-in real
    if (realIn) {
      const diffMs = now.getTime() - realIn.getTime()
      if (diffMs < 60 * 60 * 1000) {
        throw new Error("No se puede realizar el check-out: la estadía mínima es de 1 hora desde el check-in.")
      }
    }

    try {
      // Deja que el backend use el "now" por defecto (sin enviar fecha)
      await checkOutReservation(id)
      await loadReservations({ silent: true })
      // Tras checkout, las camas quedan PARA_LIMPIAR -> refrescar listado de camas
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
    } catch (error) {
      console.error("Error en check-out:", error)
      // Fallback: recargar y verificar si el backend igualmente marcó checkout
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
      const msg =
        anyErr?.response?.data?.detail ||
        anyErr?.response?.data?.error ||
        anyErr?.response?.data?.message ||
        anyErr?.message ||
        "Error al realizar check-out"
      throw new Error(msg)
    }
  }




  const extendReservationStay = async (reservationId: number, newCheckOut: Date): Promise<{ ok: boolean; message?: string }> => {
    try {
      await extendStayRequest(reservationId, newCheckOut)
      await loadReservations({ silent: true })
      try { window.dispatchEvent(new Event('beds:reload')) } catch {}
      return { ok: true }
    } catch (error) {
      console.error("Error extendiendo estad?a:", error)
      const err = error as any
      const data = err?.response?.data
      const message =
        data?.detail ||
        data?.nuevo_check_out ||
        data?.check_out ||
        data?.error ||
        err?.message ||
        "No se pudo extender la estad?a"
      return { ok: false, message }
    }
  }


  return {
    reservations,
    listError,
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
    isSaving,
    handleCheckIn,
    handleCheckOut,
    pendingCheckins,
    overdueCheckins,
    readyCheckouts,
    quickCheckIn,
    bulkCheckIn,
    markNoShow,
    snoozeReservation,
    extendReservationStay,
    checkInWarning,
    dismissCheckInWarning,
    fieldErrors,
    formError,
    clearFieldError,

  }
}

import type { reservation, GuestData } from "../types/reservations"
import apiClient from "../../../lib/apiClient"

// No hay mocks: todo va contra el backend real

// Tipos de respuesta del backend
type CamaDetalle = { cama_numero: number; cliente_nombre: string }
type ReservaApi = {
  id: number
  check_in: string
  check_out: string
  estado?: string
  huespedes?: number[]
  camas_detalle?: CamaDetalle[]
  real_check_in?: string | null
  real_check_out?: string | null
  status?: string
}
type CamasDisponiblesItem = { numero: number }
type CamasDisponiblesResponse = CamasDisponiblesItem[] | { results: CamasDisponiblesItem[] } | { availableBeds: number[] }

// Cache para mapear numero de cama -> id de cama
let bedNumberToId: Map<number, number> | null = null

async function ensureBedsMap(): Promise<Map<number, number>> {
  if (bedNumberToId) return bedNumberToId
  const resp = await apiClient.get(`/camas/`)
  const data = resp.data as { id: number; numero: number }[]
  bedNumberToId = new Map<number, number>(data.map(b => [b.numero, b.id]))
  return bedNumberToId
}

function cleanDoc(dni: string): string {
  return (dni || "").replace(/[^0-9A-Za-z]/g, "").trim()
}

async function findOrCreateClient(guest: GuestData): Promise<number> {
  const documento = cleanDoc(guest.dni)
  // Buscar por documento usando search
  try {
    const q = encodeURIComponent(documento)
    const resp = await apiClient.get(`/clientes/?search=${q}`)
    const list = resp.data as { id: number; documento?: string }[]
    // Buscar coincidencia exacta por documento si está disponible
    const found = list.find((c) => (c.documento || "").replace(/\D/g, "") === documento.replace(/\D/g, ""))
    if (found?.id) return found.id
  } catch { /* continuar a crear */ }

  const payload = {
    nombre: guest.name || "-",
    apellido: guest.lastName || "-",
    documento: documento,
    telefono: (guest as any).telefono || "-",
    patente: guest.license || null,
  }
  const created = await apiClient.post(`/clientes/`, payload)
  return created.data.id as number
}

function formatToBackend(dt: Date): string {
  // El backend acepta ISO o 'YYYY-MM-DD HH:MM'; enviamos ISO para simplicidad
  return dt.toISOString()
}

export async function fetchReservations(): Promise<reservation[]> {
  try {
    const { data } = await apiClient.get(`/reservas/`)
    return (data as ReservaApi[]).map((r) => {
      const guestDetails: GuestData[] = (r.camas_detalle || []).map((c: CamaDetalle) => ({
        name: (c.cliente_nombre || "").split(" ")[0] || "",
        lastName: (c.cliente_nombre || "").split(" ").slice(1).join(" ") || "",
        dni: "",
        email: "",
        telefono: "",
        origin: "",
        license: "",
        notes: "",
        breakfast: false,
        bedNumber: c.cama_numero ?? null,
      }))
      return {
        id: r.id,
        checkIn: new Date(r.check_in),
        checkOut: new Date(r.check_out),
        status: (r.estado || r.status || "activa") as reservation["status"],
        guests: Math.max(guestDetails.length, (r.huespedes?.length || 0)),
        guestDetails,
        realCheckInDateTime: r.real_check_in ? new Date(r.real_check_in) : null,
        realCheckOutDateTime: r.real_check_out ? new Date(r.real_check_out) : null,
      } as reservation
    })
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export async function fetchAvailableBeds(checkIn: string, checkOut: string): Promise<number[]> {
  try {
    const { data } = await apiClient.get<CamasDisponiblesResponse>(`/camas/disponibles/`, {
      params: { check_in: checkIn, check_out: checkOut },
    })
    // Aceptar varios formatos de respuesta: lista de objetos {numero} o { availableBeds: [] }
    if (Array.isArray(data)) {
      // Caso 1: [ { numero: 4 }, { numero: 5 } ]
      const direct = data.map((b) => (b as CamasDisponiblesItem).numero).filter((n): n is number => typeof n === 'number')
      if (direct.length > 0) return direct
      // Caso 2: [ { camas_disponibles: [{ id, numero, ... }, ...] } ]
      const first: any = data[0]
      if (first && Array.isArray(first.camas_disponibles)) {
        return first.camas_disponibles
          .map((b: any) => b.numero)
          .filter((n: any): n is number => typeof n === 'number')
      }
    }
    if ('results' in data && Array.isArray((data as { results: CamasDisponiblesItem[] }).results)) {
      return (data as { results: CamasDisponiblesItem[] }).results.map(b => b.numero).filter((n): n is number => typeof n === 'number')
    }
    if ('availableBeds' in data && Array.isArray((data as { availableBeds: number[] }).availableBeds)) {
      return (data as { availableBeds: number[] }).availableBeds
    }
    // Caso 3: { camas_disponibles: [{ numero, ... }] }
    const anyData = data as any
    if (anyData && Array.isArray(anyData.camas_disponibles)) {
      return anyData.camas_disponibles
        .map((b: any) => b.numero)
        .filter((n: any): n is number => typeof n === 'number')
    }
    return []
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export async function createReservation(formData: Omit<reservation, 'id'> & { senia?: number; notas?: string }): Promise<reservation> {
  const guestsArr = formData.guestDetails
  if (!guestsArr?.length) throw new Error('No hay huéspedes para la reserva')

  const titularId = await findOrCreateClient(guestsArr[0])
  const otherIds = await Promise.all(guestsArr.slice(1).map(findOrCreateClient))

  const bedsMap = await ensureBedsMap()
  const camas = await Promise.all(guestsArr.map(async (g, i) => {
    const num = g.bedNumber
    if (num == null) throw new Error('Falta asignar cama')
    const camaId = bedsMap.get(num)
    if (!camaId) throw new Error(`No se encontró id para cama numero ${num}`)
    const clienteId = i === 0 ? titularId : otherIds[i - 1]
    return { cliente: clienteId, cama: camaId }
  }))

  const payload: Record<string, any> = {
    cliente: titularId,
    huespedes: otherIds,
    camas,
    check_in: formatToBackend(formData.checkIn),
    check_out: formatToBackend(formData.checkOut),
  }
  if (typeof formData.senia !== 'undefined') payload.senia = formData.senia
  if (formData.notas && formData.notas.trim() !== '') payload.notas = formData.notas

  const { data } = await apiClient.post(`/reservas/`, payload)
  const guestDetails: GuestData[] = ((data as ReservaApi).camas_detalle || []).map((c: CamaDetalle) => ({
    name: (c.cliente_nombre || "").split(" ")[0] || "",
    lastName: (c.cliente_nombre || "").split(" ").slice(1).join(" ") || "",
    dni: "",
    email: "",
    telefono: "",
    origin: "",
    license: "",
    notes: "",
    breakfast: false,
    bedNumber: c.cama_numero ?? null,
  }))
  return {
    id: (data as ReservaApi).id,
    checkIn: new Date((data as ReservaApi).check_in),
    checkOut: new Date((data as ReservaApi).check_out),
    status: 'activa',
    guests: Math.max(guestDetails.length, (((data as ReservaApi).huespedes)?.length || 0)),
    guestDetails,
  }
}

export async function updateReservation(id: number, reservation: reservation): Promise<reservation> {
  try {
    // Recalcular payload similar a create para actualizar fechas y camas
    const guestsArr = reservation.guestDetails
    const titularId = await findOrCreateClient(guestsArr[0])
    const otherIds = await Promise.all(guestsArr.slice(1).map(findOrCreateClient))
    const bedsMap = await ensureBedsMap()
    const camas = await Promise.all(guestsArr.map(async (g, i) => {
      const num = g.bedNumber
      if (num == null) throw new Error('Falta asignar cama')
      const camaId = bedsMap.get(num)
      if (!camaId) throw new Error(`No se encontró id para cama numero ${num}`)
      const clienteId = i === 0 ? titularId : otherIds[i - 1]
      return { cliente: clienteId, cama: camaId }
    }))

    const payload: Record<string, any> = {
      cliente: titularId,
      huespedes: otherIds,
      camas,
      check_in: formatToBackend(reservation.checkIn),
      check_out: formatToBackend(reservation.checkOut),
    }
    // Solo enviar notas si existen en la reserva (evitar hardcodear)
    const notas = (reservation as any).notas as string | undefined
    if (notas && notas.trim() !== '') payload.notas = notas

    const { data } = await apiClient.patch<ReservaApi>(`/reservas/${id}/`, payload)
    return {
      id: data.id,
      checkIn: new Date(data.check_in),
      checkOut: new Date(data.check_out),
      status: (data.estado || data.status || "activa") as reservation["status"],
      guests: reservation.guests,
      guestDetails: reservation.guestDetails,
    }
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export async function deleteReservation(id: number): Promise<void> {
  try {
    await apiClient.delete(`/reservas/${id}/`)
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export async function checkInReservation(id: number, when?: Date): Promise<void> {
  try {
    const payload = when ? { check_in: formatToBackend(when) } : undefined
    await apiClient.post(`/reservas/${id}/checkin/`, payload)
  } catch (error) {
    console.error('Error en check-in:', error)
    throw error
  }
}

export async function checkOutReservation(id: number, when?: Date): Promise<void> {
  try {
    const payload = when ? { check_out: formatToBackend(when) } : undefined
    await apiClient.post(`/reservas/${id}/checkout/`, payload)
  } catch (error) {
    console.error('Error en check-out:', error)
    throw error
  }
}

import type { reservation, GuestData } from "../types/reservations"
import apiClient from "../../../lib/apiClient"

// No hay mocks: todo va contra el backend real

// Tipos de respuesta del backend
export type CamaDetalle = { cama_numero: number; cliente_nombre: string }
export type PersonaDetalle = { id: number; nombre: string; apellido: string; documento?: string; telefono?: string; direccion?: string; patente?: string | null }
export type ReservaApi = {
  id: number
  check_in: string
  check_out: string
  estado?: string | null
  huespedes?: number[]
  camas_detalle?: CamaDetalle[]
  huespedes_detalle?: PersonaDetalle[]
  cliente_detalle?: PersonaDetalle
  checked_in_at?: string | null
  checked_out_at?: string | null
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
  // El backend guarda documento sin separadores; usamos solo dígitos
  return (dni || "").replace(/\D/g, "").trim()
}

function cleanPhone(phone: string): string {
  return (phone || "").replace(/\D/g, "").trim()
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
    nombre: guest.name || "N/A",
    apellido: guest.lastName || "N/A",
    documento: documento,
    telefono: cleanPhone((guest as any).telefono || ""),
    patente: guest.license || null,
  }
  const created = await apiClient.post(`/clientes/`, payload)
  return created.data.id as number
}

function pad(n: number): string { return n < 10 ? `0${n}` : `${n}` }
function formatToBackend(dt: Date): string {
  // Backend espera 'YYYY-MM-DD HH:MM' sin zona horaria (USE_TZ=False)
  const year = dt.getFullYear()
  const month = pad(dt.getMonth() + 1)
  const day = pad(dt.getDate())
  const hours = pad(dt.getHours())
  const minutes = pad(dt.getMinutes())
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function addMonths(d: Date, months: number) {
  const copy = new Date(d.getTime())
  copy.setMonth(copy.getMonth() + months)
  return copy
}

function validateStayWindow(ci: Date, co: Date): string | null {
  if (!(ci instanceof Date) || isNaN(ci.getTime()) || !(co instanceof Date) || isNaN(co.getTime())) return 'Fechas inválidas'
  if (co.getTime() <= ci.getTime()) return 'El check-out debe ser posterior al check-in'
  const durationMs = co.getTime() - ci.getTime()
  if (durationMs < 60 * 60 * 1000) return 'La estadía mínima es de 1 hora'
  if (durationMs > 30 * 24 * 60 * 60 * 1000) return 'La estadía máxima es de 30 días'
  const now = new Date()
  if (ci.getTime() < now.getTime() - 60 * 60 * 1000) return 'El check-in no puede estar en el pasado por más de 1 hora'
  const limit = addMonths(now, 6)
  if (ci.getTime() > limit.getTime() || co.getTime() > limit.getTime()) return 'Las fechas no pueden superar los 6 meses desde hoy'
  return null
}

function parseBackendError(err: any): never {
  const data = err?.response?.data
  if (!data) throw err
  if (typeof data === 'string') throw new Error(data)
  try {
    const parts: string[] = []
    Object.entries(data).forEach(([k, v]) => {
      if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`)
      else if (typeof v === 'string') parts.push(`${k}: ${v}`)
      else parts.push(`${k}: ${JSON.stringify(v)}`)
    })
    throw new Error(parts.join('\n') || 'Error en la solicitud')
  } catch {
    throw err
  }
}

function mapApiEstadoToUi(r: ReservaApi): reservation["status"] {
  // Primero usar checked_in/out si están disponibles
  if (r.checked_out_at) return "completada"
  if (r.checked_in_at) return "en_progreso"
  // Fallback a campo estado si viene provisto
  const e = (r.estado || r.status || "").toString().toUpperCase()
  switch (e) {
    case "CHECKED_OUT":
    case "COMPLETADA":
      return "completada"
    case "CHECKED_IN":
    case "EN_PROGRESO":
      return "en_progreso"
    case "CANCELADA":
    case "NO_SHOW":
      return "cancelada"
    case "RESERVADA":
    case "ACTIVA":
    default:
      return "activa"
  }
}

export async function fetchReservations(): Promise<reservation[]> {
  try {
    const { data } = await apiClient.get(`/reservas/`)
    const nowTs = Date.now()
    const soonWindowMs = 20 * 60 * 1000
    return (data as ReservaApi[]).map((r) => {
  const guestDetails: GuestData[] = (r.camas_detalle || []).map((c: CamaDetalle) => ({
    name: (c.cliente_nombre || "").split(" ")[0] || "",
    lastName: (c.cliente_nombre || "").split(" ").slice(1).join(" ") || "",
    dni: "",
    email: "",
    telefono: "",
    direccion: "",
    origin: "",
    license: "",
    notes: "",
    breakfast: false,
    bedNumber: c.cama_numero ?? null,
  }))
      // Estado base segun backend
      let uiStatus = mapApiEstadoToUi(r)
      // Si aún no hizo check-in pero está dentro de la ventana previa al check-in, mostrar "en_progreso" en UI
      if (!r.checked_in_at && !r.checked_out_at) {
        const ci = new Date(r.check_in).getTime()
        if (!isNaN(ci) && nowTs >= (ci - soonWindowMs)) {
          // Mantener cancelada si corresponde
          const e = (r.estado || r.status || "").toString().toUpperCase()
          if (e !== 'CANCELADA' && e !== 'NO_SHOW') uiStatus = 'en_progreso'
        }
      }

      return {
        id: r.id,
        checkIn: new Date(r.check_in),
        checkOut: new Date(r.check_out),
        status: uiStatus,
        guests: Math.max(guestDetails.length, (r.huespedes?.length || 0)),
        guestDetails,
        realCheckInDateTime: r.checked_in_at ? new Date(r.checked_in_at) : null,
        realCheckOutDateTime: r.checked_out_at ? new Date(r.checked_out_at) : null,
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

  // Validar fechas para evitar 400 desde el backend
  const ci = formData.checkIn
  const co = formData.checkOut
  const dateErr = validateStayWindow(ci, co)
  if (dateErr) throw new Error(dateErr)

  const payload: Record<string, any> = {
    cliente: titularId,
    huespedes: otherIds,
    camas,
    check_in: formatToBackend(formData.checkIn),
    check_out: formatToBackend(formData.checkOut),
  }
  if (typeof formData.senia !== 'undefined') {
    const val = typeof formData.senia === 'number' ? formData.senia : Number(formData.senia)
    if (!isNaN(val)) payload.senia = val.toFixed(2)
  }
  if (formData.notas && formData.notas.trim() !== '') payload.notas = formData.notas

  let data: any
  try {
    const resp = await apiClient.post(`/reservas/`, payload)
    data = resp.data
  } catch (err) {
    parseBackendError(err)
  }
  const guestDetails: GuestData[] = ((data as ReservaApi).camas_detalle || []).map((c: CamaDetalle) => ({
    name: (c.cliente_nombre || "").split(" ")[0] || "",
    lastName: (c.cliente_nombre || "").split(" ").slice(1).join(" ") || "",
    dni: "",
    email: "",
    telefono: "",
    direccion: "",
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

    // Validar fechas locales
    const dateErr = validateStayWindow(reservation.checkIn, reservation.checkOut)
    if (dateErr) throw new Error(dateErr)

    const { data } = await apiClient.patch<ReservaApi>(`/reservas/${id}/`, payload)
    return {
      id: data.id,
      checkIn: new Date(data.check_in),
      checkOut: new Date(data.check_out),
      status: mapApiEstadoToUi(data),
      guests: reservation.guests,
      guestDetails: reservation.guestDetails,
    }
  } catch (error) {
    console.error('Error:', error)
    parseBackendError(error)
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
    const payload = when ? { check_in: formatToBackend(when) } : {}
    await apiClient.post(`/reservas/${id}/checkin/`, payload)
  } catch (error) {
    console.error('Error en check-in:', error)
    throw error
  }
}

// Obtiene una reserva por id y enriquece guestDetails con DNI/telefono/direccion cuando es posible
export async function fetchReservationById(id: number): Promise<reservation> {
  try {
    const { data } = await apiClient.get<ReservaApi>(`/reservas/${id}/`)

    // Base guestDetails a partir de camas_detalle (trae cama_numero + nombre)
    const guestDetails: GuestData[] = (data.camas_detalle || []).map((c: CamaDetalle) => {
      const full = (c.cliente_nombre || "").trim()
      const parts = full.split(" ")
      const name = parts[0] || ""
      const lastName = parts.slice(1).join(" ") || ""
      return {
        name,
        lastName,
        dni: "",
        email: "",
        telefono: "",
        direccion: "",
        origin: "",
        license: "",
        notes: "",
        breakfast: false,
        bedNumber: typeof c.cama_numero === 'number' ? c.cama_numero : null,
      }
    })

    // Mapa auxiliar: nombre normalizado -> índice en guestDetails
    const norm = (s: string) => (s || "").normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
    const byName = new Map<string, number>()
    guestDetails.forEach((g, i) => byName.set(norm(`${g.name} ${g.lastName}`), i))

    // Intentar enriquecer con cliente_detalle (titular)
    const titular = data.cliente_detalle
    if (titular) {
      const key = norm(`${titular.nombre} ${titular.apellido}`)
      const idx = byName.get(key)
      const apply = (i: number) => {
        guestDetails[i].dni = titular.documento || guestDetails[i].dni
        ;(guestDetails[i] as any).telefono = titular.telefono || (guestDetails[i] as any).telefono
        ;(guestDetails[i] as any).direccion = titular.direccion || (guestDetails[i] as any).direccion
        guestDetails[i].license = (titular.patente || '') as string
      }
      if (typeof idx === 'number') apply(idx)
      else {
        // Si no está en camas_detalle, agregarlo sin cama
        guestDetails.unshift({
          name: titular.nombre,
          lastName: titular.apellido,
          dni: titular.documento || "",
          email: "",
          telefono: titular.telefono || "",
          direccion: (titular as any).direccion || "",
          origin: "",
          license: (titular.patente || '') as string,
          notes: "",
          breakfast: false,
          bedNumber: null,
        })
      }
    }

    // Enriquecer con huespedes_detalle consultando clientes por id (para obtener documento)
    const hues = Array.isArray(data.huespedes_detalle) ? data.huespedes_detalle : []
    if (hues.length > 0) {
      const details = await Promise.all(
        hues.map(async (h) => {
          try {
            const resp = await apiClient.get<any>(`/clientes/${h.id}/`)
            return { h, c: resp.data }
          } catch {
            return { h, c: null as any }
          }
        })
      )
      details.forEach(({ h, c }) => {
        const key = norm(`${h.nombre} ${h.apellido}`)
        const idx = byName.get(key)
        if (typeof idx === 'number') {
          if (c) {
            guestDetails[idx].dni = c.documento || guestDetails[idx].dni
            ;(guestDetails[idx] as any).telefono = c.telefono || (guestDetails[idx] as any).telefono
            ;(guestDetails[idx] as any).direccion = c.direccion || (guestDetails[idx] as any).direccion
            guestDetails[idx].license = c.patente || guestDetails[idx].license
          }
        }
      })
    }

    return {
      id: data.id,
      checkIn: new Date(data.check_in),
      checkOut: new Date(data.check_out),
      status: mapApiEstadoToUi(data),
      guests: Math.max(guestDetails.length, (data.huespedes?.length || 0)),
      guestDetails,
      realCheckInDateTime: data.checked_in_at ? new Date(data.checked_in_at) : null,
      realCheckOutDateTime: data.checked_out_at ? new Date(data.checked_out_at) : null,
    }
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export async function checkOutReservation(id: number, when?: Date): Promise<void> {
  try {
    const payload = when ? { check_out: formatToBackend(when) } : {}
    await apiClient.post(`/reservas/${id}/checkout/`, payload)
  } catch (error) {
    console.error('Error en check-out:', error)
    throw error
  }
}

export async function noShowReservation(id: number): Promise<void> {
  try {
    await apiClient.post(`/reservas/${id}/no_show/`)
  } catch (error) {
    console.error('Error en no-show:', error)
    throw error
  }
}

export async function cleanBedsByNumbers(bedNumbers: number[]): Promise<void> {
  const bedsMap = await ensureBedsMap()
  const ids = bedNumbers
    .map((n) => bedsMap.get(n))
    .filter((id): id is number => typeof id === 'number')
  for (const id of ids) {
    try {
      await apiClient.post(`/camas/${id}/limpiar/`)
    } catch (err) {
      console.error('Error limpiando cama', id, err)
    }
  }
}

export async function fetchReservationsRaw(): Promise<ReservaApi[]> {
  const { data } = await apiClient.get(`/reservas/`)
  return (Array.isArray(data) ? data : []) as ReservaApi[]
}

// Fuerza recálculo de estados de reservas/camas en backend
export async function refreshReservationStates(): Promise<void> {
  try {
    await apiClient.get(`/reservas/actualizar_estados/`)
  } catch (e) {
    // no bloquear flujo por este recálculo
    console.warn('No se pudo actualizar estados:', e)
  }
}

// Verificar si se puede extender una reserva hasta newCheckOut manteniendo las mismas camas
export async function checkExtensionAvailability(res: reservation, newCheckOut: Date): Promise<{ ok: boolean; unavailableBeds: number[]; alternatives: number[] }> {
  const available = await fetchAvailableBeds(formatToBackend(res.checkIn), formatToBackend(newCheckOut))
  const currentBeds = res.guestDetails.map(g => g.bedNumber).filter((n): n is number => typeof n === 'number')
  const unavailable = currentBeds.filter(n => !available.includes(n))
  return { ok: unavailable.length === 0, unavailableBeds: unavailable, alternatives: available }
}

// Extiende la reserva actualizando solo el check_out (backend mantiene camas y huéspedes)
export async function extendReservation(id: number, newCheckOut: Date): Promise<reservation> {
  const payload = { check_out: formatToBackend(newCheckOut) }
  const { data } = await apiClient.patch<ReservaApi>(`/reservas/${id}/`, payload)
  return {
    id: data.id,
    checkIn: new Date(data.check_in),
    checkOut: new Date(data.check_out),
    status: mapApiEstadoToUi(data),
    guests: 0, // se calculará en la UI desde guestDetails si es necesario
    guestDetails: [],
  }
}

import apiClient from "../../../lib/apiClient"
import type { BedApiStatus, BedData, BedStatus } from "../types/beds"

type RawGuest = {
  cliente_nombre?: string
  check_in?: string
  check_out?: string
}

type BedApiModel = {
  id: number
  numero: number
  estado: BedApiStatus
  estado_actual?: BedApiStatus | null
  reserva_actual?: RawGuest | null
}

const API_TO_UI_STATUS: Record<BedApiStatus, BedStatus> = {
  LIBRE: "libre",
  OCUPADA: "ocupada",
  PARA_LIMPIAR: "limpieza",
  EN_PROCESO: "proceso",
}

const UI_TO_API_STATUS: Record<BedStatus, BedApiStatus> = {
  libre: "LIBRE",
  ocupada: "OCUPADA",
  limpieza: "PARA_LIMPIAR",
  proceso: "EN_PROCESO",
}

const normalizeGuest = (guest?: RawGuest | null) => {
  if (!guest) return undefined
  const name = guest.cliente_nombre?.trim()
  const checkIn = guest.check_in?.trim()
  const checkOut = guest.check_out?.trim()

  if (!name && !checkIn && !checkOut) return undefined

  return {
    name: name || "Reserva asignada",
    checkIn: checkIn || "--",
    checkOut: checkOut || "--",
  }
}

const parseLocal = (value?: string | null): Date | null => {
  if (!value) return null
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!m) {
    const d = new Date(value.replace(' ', 'T'))
    return isNaN(d.getTime()) ? null : d
  }
  const [_, y, mo, d, h, mi, s] = m
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), s ? Number(s) : 0)
}

const mapBedFromApi = (bed: BedApiModel): BedData => {
  const rawStatus = (bed.estado_actual || bed.estado) as BedApiStatus
  let status = API_TO_UI_STATUS[rawStatus] ?? "libre"

  // Override temporal: si hay reserva asignada y estamos en ventana de check-in
  // mantener "proceso" hasta que ocurra el check-in real, aunque el backend marque limpieza.
  const r = bed.reserva_actual ?? null
  if (r) {
    const now = Date.now()
    const ci = parseLocal(r.check_in)?.getTime() ?? null
    const co = parseLocal(r.check_out)?.getTime() ?? null
    const soonWindowMs = 20 * 60 * 1000 // 20 min antes del check-in
    if (ci && co) {
      const withinWindow = now >= (ci - soonWindowMs) && now < co
      if (withinWindow && (rawStatus === 'PARA_LIMPIAR' || rawStatus === 'LIBRE')) {
        status = 'proceso'
      }
    }
  }

  return {
    id: bed.numero,
    backendId: bed.id,
    status,
    backendStatus: rawStatus,
    guest: normalizeGuest(bed.reserva_actual ?? undefined),
  }
}

export const fetchBeds = async (): Promise<BedData[]> => {
  const { data } = await apiClient.get<BedApiModel[]>("/camas/")
  return (Array.isArray(data) ? data : []).map(mapBedFromApi).sort((a, b) => a.id - b.id)
}

export const updateBedStatus = async (backendId: number, status: BedStatus): Promise<BedData> => {
  const payload = { estado: UI_TO_API_STATUS[status] }
  const { data } = await apiClient.patch<BedApiModel>(`/camas/${backendId}/`, payload)
  return mapBedFromApi(data)
}

export const cleanBed = async (backendId: number): Promise<BedData> => {
  const { data } = await apiClient.post<BedApiModel>(`/camas/${backendId}/limpiar/`)
  return mapBedFromApi(data)
}

export const bedsStatusMapping = {
  apiToUi: API_TO_UI_STATUS,
  uiToApi: UI_TO_API_STATUS,
}

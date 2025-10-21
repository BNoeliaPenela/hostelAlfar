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

const mapBedFromApi = (bed: BedApiModel): BedData => {
  const effectiveStatus = (bed.estado_actual || bed.estado) as BedApiStatus
  const status = API_TO_UI_STATUS[effectiveStatus] ?? "libre"
  return {
    id: bed.numero,
    backendId: bed.id,
    status,
    backendStatus: effectiveStatus,
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

export const bedsStatusMapping = {
  apiToUi: API_TO_UI_STATUS,
  uiToApi: UI_TO_API_STATUS,
}

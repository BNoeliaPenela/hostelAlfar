import apiClient from "@/lib/apiClient"

/**
 * Respuesta del endpoint de ocupacion diaria.
 * Todas las unidades de tiempo se expresan en segundos.
 */
export interface DailyOccupancyResponse {
  camas: number
  capacidad_segundos: number
  ocupado_segundos: number
  tasa: number
  porcentaje: number
  periodo_inicio: string
  periodo_fin: string
  base: string
}

/**
 * Desglose diario que acompana el reporte mensual de ocupacion.
 */
export interface MonthlyDailyBreakdown {
  fecha: string
  ocupado_segundos: number
  tasa: number
  porcentaje: number
}

/**
 * Respuesta del endpoint de ocupacion mensual incluyendo el detalle dia a dia.
 */
export interface MonthlyOccupancyResponse {
  camas: number
  capacidad_segundos: number
  ocupado_segundos: number
  tasa: number
  porcentaje: number
  periodo_inicio: string
  periodo_fin: string
  base: string
  diario: MonthlyDailyBreakdown[]
}

/**
 * Respuesta del endpoint de ocupacion total dentro de un rango arbitrario.
 */
export interface TotalOccupancyResponse {
  camas: number
  capacidad_segundos: number
  ocupado_segundos: number
  tasa: number
  porcentaje: number
  periodo_inicio: string
  periodo_fin: string
  base: string
}

/**
 * Obtiene el resumen de ocupacion por dia.
 *
 * @param date Fecha objetivo en formato `YYYY-MM-DD`. Si se omite, el backend usa el dia actual.
 * @returns Resumen de ocupacion diaria para la fecha indicada.
 */
export async function fetchDailyOccupancy(date?: string): Promise<DailyOccupancyResponse> {
  if (date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const requested = new Date(`${date}T00:00:00`)

    if (requested.getTime() > today.getTime()) {
      const error = new RangeError("La fecha solicitada pertenece a un periodo futuro.")
      error.name = "FutureDateError"
      throw error
    }
  }

  const params = date ? { fecha: date } : undefined
  const response = await apiClient.get<DailyOccupancyResponse>("/reportes/ocupacion-diaria", { params })
  return response.data
}

/**
 * Obtiene el resumen de ocupacion de un mes calendario y su desglose diario.
 *
 * @param year Ano objetivo en formato numerico (`YYYY`). Si no se indica, el backend usa el ano actual.
 * @param month Mes objetivo en formato numerico (`MM`). Si no se indica, el backend usa el mes actual.
 * @returns Resumen mensual de ocupacion y el detalle diario asociado.
 */
export async function fetchMonthlyOccupancy(
  year?: number,
  month?: number,
): Promise<MonthlyOccupancyResponse> {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const targetYear = typeof year === "number" ? year : currentYear
  const normalizedMonth = Math.min(Math.max(typeof month === "number" ? month : currentMonth, 1), 12)

  const targetPeriodStart = new Date(targetYear, normalizedMonth - 1, 1)
  const currentPeriodStart = new Date(currentYear, currentMonth - 1, 1)

  if (targetPeriodStart.getTime() > currentPeriodStart.getTime()) {
    const error = new RangeError("El periodo solicitado pertenece al futuro.")
    error.name = "FuturePeriodError"
    throw error
  }

  const params: Record<string, string> = {}
  if (typeof year === "number") params.anio = targetYear.toString()
  if (typeof month === "number") params.mes = normalizedMonth.toString().padStart(2, "0")

  const response = await apiClient.get<MonthlyOccupancyResponse>("/reportes/ocupacion-mensual", {
    params: Object.keys(params).length ? params : undefined,
  })
  return response.data
}

/**
 * Obtiene el resumen historico de ocupacion para un rango de fechas dado.
 *
 * @param from Fecha de inicio en formato `YYYY-MM-DD`. Si se omite, se usa el primer registro disponible.
 * @param to Fecha de fin en formato `YYYY-MM-DD`. Si se omite, se usa el ultimo registro disponible.
 * @returns Resumen de ocupacion acumulada en el rango indicado.
 */
export async function fetchTotalOccupancy(
  from?: string,
  to?: string,
): Promise<TotalOccupancyResponse> {
  const params: Record<string, string> = {}
  if (from) params.desde = from
  if (to) params.hasta = to

  const response = await apiClient.get<TotalOccupancyResponse>("/reportes/ocupacion-total", {
    params: Object.keys(params).length ? params : undefined,
  })
  return response.data
}

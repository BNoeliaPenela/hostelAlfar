import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import {
  fetchDailyOccupancy,
  fetchMonthlyOccupancy,
  fetchTotalOccupancy,
  type DailyOccupancyResponse,
  type MonthlyOccupancyResponse,
  type TotalOccupancyResponse,
} from "../services/reportsService"

/**
 * Describe el periodo seleccionado para el reporte mensual.
 */
export interface MonthlyPeriod {
  year: number
  month: number
}

/**
 * Describe el rango personalizado para el reporte historico.
 */
export interface TotalRange {
  from: string
  to: string
}

/**
 * Estados de carga diferenciados por cada seccion del reporte.
 */
interface LoadingState {
  daily: boolean
  monthly: boolean
  total: boolean
}

/**
 * Mensajes de error asociados a cada seccion del reporte.
 */
interface ErrorState {
  daily?: string
  monthly?: string
  total?: string
}

/**
 * Estado inicial en el que ninguna seccion se encuentra cargando.
 */
const initialLoading: LoadingState = {
  daily: false,
  monthly: false,
  total: false,
}

/**
 * Hook centralizado para consumir y combinar los endpoints de reportes de ocupacion.
 * Expone los datos recibidos, los estados de carga/error y controladores para los filtros de fecha.
 */
export function useReports() {
  const now = new Date()
  const [dailyDate, setDailyDate] = useState(format(now, "yyyy-MM-dd"))
  const [monthlyPeriod, setMonthlyPeriod] = useState<MonthlyPeriod>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  })
  const [totalRange, setTotalRange] = useState<TotalRange>({
    from: "",
    to: "",
  })

  const [daily, setDaily] = useState<DailyOccupancyResponse | null>(null)
  const [monthly, setMonthly] = useState<MonthlyOccupancyResponse | null>(null)
  const [total, setTotal] = useState<TotalOccupancyResponse | null>(null)

  const [loading, setLoading] = useState<LoadingState>(initialLoading)
  const [errors, setErrors] = useState<ErrorState>({})

  /**
   * Recupera la ocupacion diaria para la fecha indicada (usa la actual por defecto).
   */
  const loadDaily = useCallback(
    async (date: string = dailyDate) => {
      setLoading((prev) => ({ ...prev, daily: true }))
      setErrors((prev) => ({ ...prev, daily: undefined }))

      try {
        const response = await fetchDailyOccupancy(date)
        setDaily(response)
      } catch (error) {
        console.error("Error cargando ocupacion diaria:", error)
        setErrors((prev) => ({
          ...prev,
          daily: "No pudimos cargar la ocupacion diaria.",
        }))
      } finally {
        setLoading((prev) => ({ ...prev, daily: false }))
      }
    },
    [dailyDate],
  )

  /**
   * Recupera el reporte mensual para el periodo activo (ano y mes).
   */
  const loadMonthly = useCallback(
    async (year: number = monthlyPeriod.year, month: number = monthlyPeriod.month) => {
      setLoading((prev) => ({ ...prev, monthly: true }))
      setErrors((prev) => ({ ...prev, monthly: undefined }))

      try {
        const response = await fetchMonthlyOccupancy(year, month)
        setMonthly(response)
      } catch (error) {
        console.error("Error cargando ocupacion mensual:", error)
        setErrors((prev) => ({
          ...prev,
          monthly: "No pudimos cargar la ocupacion mensual.",
        }))
      } finally {
        setLoading((prev) => ({ ...prev, monthly: false }))
      }
    },
    [monthlyPeriod],
  )

  /**
   * Recupera el reporte historico para el rango seleccionado, validando el orden de fechas.
   */
  const loadTotal = useCallback(
    async (from: string = totalRange.from, to: string = totalRange.to) => {
      if (from && to && new Date(from) > new Date(to)) {
        setErrors((prev) => ({
          ...prev,
          total: "El rango seleccionado no es valido.",
        }))
        setTotal(null)
        return
      }

      setLoading((prev) => ({ ...prev, total: true }))
      setErrors((prev) => ({ ...prev, total: undefined }))

      try {
        const response = await fetchTotalOccupancy(from || undefined, to || undefined)
        setTotal(response)
      } catch (error) {
        console.error("Error cargando ocupacion historica:", error)
        setErrors((prev) => ({
          ...prev,
          total: "No pudimos cargar la ocupacion historica.",
        }))
      } finally {
        setLoading((prev) => ({ ...prev, total: false }))
      }
    },
    [totalRange],
  )

  useEffect(() => {
    loadDaily()
  }, [loadDaily])

  useEffect(() => {
    loadMonthly()
  }, [loadMonthly])

  useEffect(() => {
    loadTotal()
  }, [loadTotal])

  /**
   * Actualiza el periodo mensual manteniendo los valores no especificados.
   */
  const updateMonthlyPeriod = (period: Partial<MonthlyPeriod>) => {
    setMonthlyPeriod((prev) => ({
      year: period.year ?? prev.year,
      month: period.month ?? prev.month,
    }))
  }

  /**
   * Actualiza el rango historico manteniendo los valores no especificados.
   */
  const updateTotalRange = (range: Partial<TotalRange>) => {
    setTotalRange((prev) => ({
      from: range.from ?? prev.from,
      to: range.to ?? prev.to,
    }))
  }

  return {
    daily,
    dailyDate,
    setDailyDate,
    reloadDaily: loadDaily,
    dailyLoading: loading.daily,
    dailyError: errors.daily ?? null,

    monthly,
    monthlyPeriod,
    setMonthlyPeriod: updateMonthlyPeriod,
    reloadMonthly: loadMonthly,
    monthlyLoading: loading.monthly,
    monthlyError: errors.monthly ?? null,

    total,
    totalRange,
    setTotalRange: updateTotalRange,
    reloadTotal: loadTotal,
    totalLoading: loading.total,
    totalError: errors.total ?? null,
  }
}

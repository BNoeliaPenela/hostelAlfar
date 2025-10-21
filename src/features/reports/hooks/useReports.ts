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
  const [dailyDate, setDailyDateState] = useState(format(now, "yyyy-MM-dd"))
  const [monthlyPeriod, setMonthlyPeriodState] = useState<MonthlyPeriod>({
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

  const updateDailyDate = useCallback(
    (value: string) => {
      const todayIso = format(new Date(), "yyyy-MM-dd")

      if (value && value > todayIso) {
        setDaily(null)
        setErrors((prev) => ({
          ...prev,
          daily: "No hay datos disponibles para fechas futuras.",
        }))
        setDailyDateState(todayIso)
        return
      }

      setErrors((prev) => ({ ...prev, daily: undefined }))
      setDailyDateState(value)
    },
    [setDaily, setErrors, setDailyDateState],
  )

  /**
   * Recupera la ocupacion diaria para la fecha indicada (usa la actual por defecto).
   */
  const loadDaily = useCallback(
    async (date: string = dailyDate) => {
      const todayIso = format(new Date(), "yyyy-MM-dd")
      if (date && date > todayIso) {
        setDaily(null)
        setErrors((prev) => ({
          ...prev,
          daily: "No hay datos disponibles para fechas futuras.",
        }))
        if (dailyDate !== todayIso) {
          setDailyDateState(todayIso)
        }
        return
      }

      setLoading((prev) => ({ ...prev, daily: true }))
      setErrors((prev) => ({ ...prev, daily: undefined }))

      try {
        const response = await fetchDailyOccupancy(date)
        setDaily(response)
      } catch (error) {
        if (error instanceof Error && error.name === "FutureDateError") {
          setErrors((prev) => ({
            ...prev,
            daily: "No hay datos disponibles para fechas futuras.",
          }))
        } else {
          console.error("Error cargando ocupacion diaria:", error)
          setErrors((prev) => ({
            ...prev,
            daily: "No pudimos cargar la ocupacion diaria.",
          }))
        }
      } finally {
        setLoading((prev) => ({ ...prev, daily: false }))
      }
    },
    [dailyDate, setDailyDateState],
  )

  /**
   * Recupera el reporte mensual para el periodo activo (ano y mes).
   */
  const loadMonthly = useCallback(
    async (year: number = monthlyPeriod.year, month: number = monthlyPeriod.month) => {
      const current = new Date()
      const currentYear = current.getFullYear()
      const currentMonth = current.getMonth() + 1

      let nextYear = year
      let nextMonth = Math.min(Math.max(month, 1), 12)

      const isFuturePeriod =
        nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth)

      if (isFuturePeriod) {
        nextYear = Math.min(nextYear, currentYear)
        if (nextYear === currentYear) {
          nextMonth = Math.min(nextMonth, currentMonth)
        }

        setMonthly(null)
        setErrors((prev) => ({
          ...prev,
          monthly: "No hay datos disponibles para meses futuros.",
        }))

        setMonthlyPeriodState((prev) => {
          if (prev.year === nextYear && prev.month === nextMonth) {
            return prev
          }
          return {
            year: nextYear,
            month: nextMonth,
          }
        })

        return
      }

      setLoading((prev) => ({ ...prev, monthly: true }))
      setErrors((prev) => ({ ...prev, monthly: undefined }))

      try {
        const response = await fetchMonthlyOccupancy(nextYear, nextMonth)
        setMonthly(response)
      } catch (error) {
        if (error instanceof Error && error.name === "FuturePeriodError") {
          setErrors((prev) => ({
            ...prev,
            monthly: "No hay datos disponibles para meses futuros.",
          }))
        } else {
          console.error("Error cargando ocupacion mensual:", error)
          setErrors((prev) => ({
            ...prev,
            monthly: "No pudimos cargar la ocupacion mensual.",
          }))
        }
      } finally {
        setLoading((prev) => ({ ...prev, monthly: false }))
      }
    },
    [monthlyPeriod, setMonthlyPeriodState],
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
    setMonthlyPeriodState((prev) => {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      let nextYear = period.year ?? prev.year
      let nextMonth = period.month ?? prev.month

      nextMonth = Math.min(Math.max(nextMonth, 1), 12)

      if (nextYear > currentYear) {
        nextYear = currentYear
      }
      if (nextYear === currentYear && nextMonth > currentMonth) {
        nextMonth = currentMonth
      }

      return {
        year: nextYear,
        month: nextMonth,
      }
    })
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
    setDailyDate: updateDailyDate,
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

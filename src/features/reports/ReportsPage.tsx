import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { BedDouble, BarChart3, CalendarDays, PieChart, RefreshCcw } from "lucide-react"
import { useMemo } from "react"
import { useReports } from "./hooks/useReports"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"

/** Formatea cantidades horarias con una precisión de una decimal. */
const numberFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

/** Formatea porcentajes con hasta dos decimales para lecturas rápidas. */
const percentFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Normaliza un timestamp devuelto por el backend (con espacio) a ISO y lo transforma en Date. */
const parseBackendDate = (value: string) => parseISO(value.replace(" ", "T"))

/** Convierte una tasa en porcentaje legible o un marcador si el valor está ausente. */
const formatPercent = (value?: number) => {
  if (typeof value !== "number") return "--"
  return `${percentFormatter.format(value)}%`
}

/** Convierte segundos a horas con precisión de un decimal o retorna un marcador. */
const formatHours = (seconds?: number) => {
  if (typeof seconds !== "number") return "--"
  const hours = seconds / 3600
  return `${numberFormatter.format(hours)} h`
}

/** Formatea un timestamp del backend a una etiqueta amigable. */
const formatDateLabel = (value?: string, pattern = "dd MMM yyyy") => {
  if (!value) return "--"
  return format(parseBackendDate(value), pattern, { locale: es })
}

/** Formatea un periodo `inicio` - `fin` en una sola cadena. */
const formatRange = (start?: string, end?: string) => {
  if (!start || !end) return "--"
  const from = formatDateLabel(start)
  const to = formatDateLabel(end)
  return `${from} · ${to}`
}

/** Opciones disponibles para selección de meses en español. */
const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const month = index + 1
  const label = format(new Date(2024, index, 1), "LLLL", { locale: es })
  return { value: month.toString(), label: label.charAt(0).toUpperCase() + label.slice(1) }
})

/**
 * Página principal de reportes que consume el hook `useReports` y muestra
 * los distintos paneles (diario, mensual e histórico) con sus filtros.
 */
export default function ReportsPage() {
  const {
    daily,
    dailyDate,
    setDailyDate,
    reloadDaily,
    dailyLoading,
    dailyError,
    monthly,
    monthlyPeriod,
    setMonthlyPeriod,
    reloadMonthly,
    monthlyLoading,
    monthlyError,
    total,
    totalRange,
    setTotalRange,
    reloadTotal,
    totalLoading,
    totalError,
  } = useReports()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const todayIso = format(now, "yyyy-MM-dd")

  const yearOptions = useMemo(() => {
    const baseYears = Array.from({ length: 5 }, (_, index) => currentYear - 2 + index)
    const unique = new Set(baseYears.filter((year) => year <= currentYear))
    unique.add(Math.min(monthlyPeriod.year, currentYear))
    return Array.from(unique)
      .filter((year) => year <= currentYear)
      .sort((a, b) => a - b)
  }, [monthlyPeriod.year, currentYear])

  const availableMonthOptions = useMemo(() => {
    if (monthlyPeriod.year < currentYear) {
      return monthOptions
    }
    return monthOptions.filter((option) => Number(option.value) <= currentMonth)
  }, [monthlyPeriod.year, currentYear, currentMonth])

  const metrics = useMemo(
    () => [
      {
        title: "Ocupación diaria",
        value: formatPercent(daily?.porcentaje),
        helper: daily ? `${formatHours(daily.ocupado_segundos)} ocupadas` : "Selecciona una fecha para ver el detalle.",
        icon: <CalendarDays className="h-5 w-5 text-emerald-600" />,
      },
      {
        title: "Capacidad disponible",
        value: daily ? `${daily.camas} camas` : "--",
        helper: daily ? `${formatHours(daily.capacidad_segundos)} totales` : "",
        icon: <BedDouble className="h-5 w-5 text-indigo-600" />,
      },
      {
        title: "Ocupación mensual",
        value: formatPercent(monthly?.porcentaje),
        helper: monthly ? `${formatHours(monthly.ocupado_segundos)} ocupadas` : "",
        icon: <BarChart3 className="h-5 w-5 text-orange-600" />,
      },
      {
        title: "Histórico",
        value: formatPercent(total?.porcentaje),
        helper: total ? formatRange(total.periodo_inicio, total.periodo_fin) : "",
        icon: <PieChart className="h-5 w-5 text-sky-600" />,
      },
    ],
    [daily, monthly, total],
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reportes de ocupación</h2>
        <p className="text-sm text-gray-500">
          Consulta la ocupación diaria, mensual e histórica del hostel con los datos oficiales del backend.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{item.title}</CardTitle>
              <span className="rounded-full bg-gray-100 p-2">{item.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
              {item.helper && <p className="text-sm text-gray-500 mt-1">{item.helper}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle>Ocupación diaria</CardTitle>
                <CardDescription>
                  Selecciona la fecha que deseas analizar. El porcentaje se calcula con la fórmula: {daily?.base ?? "segundos-ocupados / (camas * 86400)"}.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reloadDaily(dailyDate)}
                disabled={dailyLoading}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="sm:w-48">
                <label className="text-xs font-medium text-gray-500">Fecha</label>
                <Input
                  type="date"
                  value={dailyDate}
                  onChange={(event) => setDailyDate(event.target.value)}
                  max={todayIso}
                  className="mt-1"
                />
              </div>
            </div>

            {dailyLoading && !daily && (
              <p className="mt-4 text-sm text-gray-500">Cargando ocupación diaria...</p>
            )}

            {dailyError && (
              <p className="mt-4 text-sm text-red-600">{dailyError}</p>
            )}

            {daily && (
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Ocupación</span>
                  <span className="font-medium text-gray-900">{formatPercent(daily.porcentaje)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tiempo ocupado</span>
                  <span className="font-medium text-gray-900">{formatHours(daily.ocupado_segundos)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Capacidad diaria</span>
                  <span className="font-medium text-gray-900">{formatHours(daily.capacidad_segundos)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Periodo</span>
                  <span className="font-medium text-gray-900 text-right">{formatRange(daily.periodo_inicio, daily.periodo_fin)}</span>
                </div>
                <p className="text-xs text-gray-400">Base: {daily.base}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <CardTitle>Ocupación mensual</CardTitle>
                  <CardDescription>
                    Analiza el mes seleccionado y revisa la ocupación acumulada y por día.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reloadMonthly(monthlyPeriod.year, monthlyPeriod.month)}
                  disabled={monthlyLoading}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="sm:w-44">
                  <label className="text-xs font-medium text-gray-500">Mes</label>
                  <Select
                    value={monthlyPeriod.month.toString()}
                    onValueChange={(value) => setMonthlyPeriod({ month: Number(value) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {availableMonthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:w-44">
                  <label className="text-xs font-medium text-gray-500">Año</label>
                  <Select
                    value={monthlyPeriod.year.toString()}
                    onValueChange={(value) => setMonthlyPeriod({ year: Number(value) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {monthlyLoading && !monthly && (
              <p className="text-sm text-gray-500">Cargando ocupación mensual...</p>
            )}

            {monthlyError && (
              <p className="text-sm text-red-600">{monthlyError}</p>
            )}

            {monthly && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                  <div>
                    <span className="block text-xs text-gray-500 uppercase">Ocupación</span>
                    <span className="text-base font-semibold text-gray-900">
                      {formatPercent(monthly.porcentaje)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 uppercase">Tiempo ocupado</span>
                    <span className="text-base font-semibold text-gray-900">
                      {formatHours(monthly.ocupado_segundos)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 uppercase">Capacidad del mes</span>
                    <span className="text-base font-semibold text-gray-900">
                      {formatHours(monthly.capacidad_segundos)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 uppercase">Periodo</span>
                    <span className="text-base font-semibold text-gray-900">
                      {formatRange(monthly.periodo_inicio, monthly.periodo_fin)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalle diario</h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {monthly.diario.length === 0 && (
                      <p className="text-sm text-gray-500">Sin datos registrados para este mes.</p>
                    )}

                    {monthly.diario.map((item) => (
                      <div key={item.fecha}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            {format(parseISO(`${item.fecha}T00:00:00`), "dd MMM", { locale: es })}
                          </span>
                          <span className="text-gray-500">
                            {percentFormatter.format(item.porcentaje)}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${Math.min(100, item.porcentaje)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-400">Base: {monthly.base}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle>Ocupación histórica</CardTitle>
              <CardDescription>
                Consulta el rango completo o filtra por fechas específicas para evaluar la ocupación acumulada.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reloadTotal(totalRange.from, totalRange.to)}
              disabled={totalLoading}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="sm:w-44">
              <label className="text-xs font-medium text-gray-500">Desde</label>
              <Input
                type="date"
                value={totalRange.from}
                onChange={(event) => setTotalRange({ from: event.target.value })}
                className="mt-1"
              />
            </div>
            <div className="sm:w-44">
              <label className="text-xs font-medium text-gray-500">Hasta</label>
              <Input
                type="date"
                value={totalRange.to}
                onChange={(event) => setTotalRange({ to: event.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {totalLoading && !total && (
            <p className="mt-4 text-sm text-gray-500">Cargando ocupación histórica...</p>
          )}

          {totalError && (
            <p className="mt-4 text-sm text-red-600">{totalError}</p>
          )}

          {total && (
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Ocupación</span>
                <span className="font-medium text-gray-900">{formatPercent(total.porcentaje)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tiempo ocupado</span>
                <span className="font-medium text-gray-900">{formatHours(total.ocupado_segundos)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Capacidad del período</span>
                <span className="font-medium text-gray-900">{formatHours(total.capacidad_segundos)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Periodo</span>
                <span className="font-medium text-gray-900 text-right">
                  {formatRange(total.periodo_inicio, total.periodo_fin)}
                </span>
              </div>
              <p className="text-xs text-gray-400">Base: {total.base}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useEffect, useMemo, useState } from "react"
import { Loader2, Search } from "lucide-react"
import type { reservation } from "../types/reservations"
import { ReservationCard } from "./ReservationCard"
import { Button } from "../../../components/ui/Button"
import { Input } from "../../../components/ui/Input"

interface ReservationsHistoryViewProps {
  reservations: reservation[]
  loading: boolean
  error?: string | null
  formatDate: (date: Date) => string
  onRefresh?: () => Promise<void>
}

const pad = (n: number) => String(n).padStart(2, "0")
const toDateInput = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const normalize = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

export function ReservationsHistoryView({ reservations, loading, error, formatDate, onRefresh }: ReservationsHistoryViewProps) {
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [status, setStatus] = useState<"historial" | reservation["status"] | "todas">("historial")
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(200)

  useEffect(() => {
    if (fromDate && toDate) return
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
    setFromDate(toDateInput(from))
    setToDate(toDateInput(now))
  }, [fromDate, toDate])

  const statusOptions = useMemo(() => {
    const set = new Set<reservation["status"]>()
    reservations.forEach((r) => set.add(r.status))
    return Array.from(set).sort()
  }, [reservations])

  const filtered = useMemo(() => {
    const q = normalize(query)
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null

    const matchQuery = (r: reservation) => {
      if (!q) return true
      const beds = r.guestDetails.map((g) => (g.bedNumber != null ? String(g.bedNumber) : "")).filter(Boolean).join(" ")
      const names = r.guestDetails.map((g) => `${g.name} ${g.lastName}`.trim()).filter(Boolean).join(" ")
      const dnis = r.guestDetails.map((g) => g.dni).filter(Boolean).join(" ")
      const haystack = normalize(`${r.id} ${names} ${dnis} ${beds}`)
      return haystack.includes(q)
    }

    const matchStatus = (r: reservation) => {
      if (status === "todas") return true
      if (status === "historial") return r.status === "completada" || r.status === "cancelada"
      return r.status === status
    }

    return reservations
      .filter((r) => {
        if (from && r.checkIn.getTime() < from.getTime()) return false
        if (to && r.checkIn.getTime() > to.getTime()) return false
        return matchStatus(r) && matchQuery(r)
      })
      .sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime())
  }, [reservations, fromDate, toDate, status, query])

  const visible = filtered.slice(0, limit)

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <div className="rounded-lg border bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Desde</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Hasta</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Estado</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="historial">Historial (completadas/canceladas)</option>
              <option value="todas">Todas</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input className="pl-9" placeholder="Cliente, DNI, cama, #reserva" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <div>
            Mostrando {visible.length} de {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLimit(200)}>
              Reset
            </Button>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={() => onRefresh()}>
                Refrescar
              </Button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Cargando historial...</span>
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">No hay resultados con los filtros actuales.</div>
      )}

      {!loading && visible.length > 0 && (
        <div className="grid gap-4">
          {visible.map((r) => (
            <ReservationCard key={r.id} reservation={r} formatDate={formatDate} readOnly />
          ))}
        </div>
      )}

      {!loading && filtered.length > visible.length && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimit((prev) => prev + 200)}>
            Mostrar más
          </Button>
        </div>
      )}
    </div>
  )
}


import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { Search, Loader2 } from "lucide-react"
import { useGuests } from "./hooks/useGuests"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { fetchReservationsRaw, type ReservaApi } from "../reservations/services/reservationService"

const GuestsPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const { guests, loading, error, searchGuests, fetchGuests } = useGuests()
  const [reservas, setReservas] = useState<ReservaApi[] | null>(null)

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      await searchGuests(searchTerm)
      return
    }
    await fetchGuests()
  }

  const handleClearSearch = async () => {
    setSearchTerm("")
    await fetchGuests()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      void handleSearch()
    }
  }

  // Cargar reservas una vez y cuando cambie la lista de huéspedes
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchReservationsRaw()
        setReservas(data)
      } catch (e) {
        console.error("Error cargando reservas para huéspedes:", e)
      }
    }
    void load()
  }, [])

  const reservasIndex = useMemo(() => {
    const map = new Map<number, ReservaApi[]>()
    if (!reservas) return map
    for (const r of reservas) {
      const involvedIds = new Set<number>()
      if (r.cliente_detalle?.id) involvedIds.add(r.cliente_detalle.id)
      if (Array.isArray(r.huespedes_detalle)) {
        for (const h of r.huespedes_detalle) {
          if (h?.id) involvedIds.add(h.id)
        }
      }
      involvedIds.forEach((gid) => {
        const arr = map.get(gid) || []
        arr.push(r)
        map.set(gid, arr)
      })
    }
    return map
  }, [reservas])

  const formatDateTime = (d: string) => {
    try { return new Date(d).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return d }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Historial de huespedes</CardTitle>
          <CardDescription>Busca y consulta la informacion registrada para cada huesped.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guest-search">Busqueda por nombre o DNI</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="guest-search"
                  placeholder="Nombre, apellido o DNI"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={() => void handleSearch()}
                disabled={loading}
                className="sm:w-auto"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buscar
              </Button>
              <Button
                onClick={() => void handleClearSearch()}
                disabled={loading}
                variant="outline"
                className="sm:w-auto"
              >
                Limpiar
              </Button>
            </div>
          </div>
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      )}

      {!loading && guests.length > 0 && (
        <div className="space-y-4">
          {guests.map((guest) => (
            <Card key={guest.id}>
              <CardHeader className="flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {guest.nombre} {guest.apellido}
                  </CardTitle>
                  <CardDescription>DNI: {guest.documento}</CardDescription>
                </div>
                {guest.patente && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
                    Patente {guest.patente}
                  </span>
                )}
              </CardHeader>
              <CardContent className="grid gap-6 py-6 text-sm sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Telefono</p>
                    <p className="text-base text-foreground">{guest.telefono || "Sin registrar"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Direccion</p>
                    <p className="text-base text-foreground">{guest.direccion || "Sin registrar"}</p>
                  </div>
                </div>
                <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-0">
                  <div className="px-4 pt-4">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Historial de estadias</p>
                  </div>
                  {/* Destacados: 2 más recientes */}
                  {reservasIndex.get(guest.id) && reservasIndex.get(guest.id)!.length > 0 ? (
                    <div className="px-4 pb-2 space-y-2">
                      {reservasIndex.get(guest.id)!
                        .slice()
                        .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime())
                        .slice(0, 2)
                        .map((r) => {
                          const camas = (r.camas_detalle || []).map((c) => c.cama_numero).filter((n): n is number => typeof n === 'number')
                          return (
                            <div key={`top-${guest.id}-${r.id}`} className="flex items-center justify-between rounded bg-white/70 border px-3 py-2">
                              <div>
                                <div className="text-xs text-muted-foreground">#{r.id} · Camas {camas.join(', ') || '-'} </div>
                                <div className="text-sm">{formatDateTime(r.check_in)} → {formatDateTime(r.check_out)}</div>
                              </div>
                              
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="px-4 pb-4">
                      <p className="mt-2 text-sm text-muted-foreground">
                        Aun no hay estadias asociadas.
                      </p>
                    </div>
                  )}
                  {/* Lista scrolleable */}
                  {reservasIndex.get(guest.id) && reservasIndex.get(guest.id)!.length > 2 && (
                    <div className="max-h-40 overflow-y-auto border-t">
                      {reservasIndex.get(guest.id)!
                        .slice()
                        .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime())
                        .slice(2)
                        .map((r) => {
                          const camas = (r.camas_detalle || []).map((c) => c.cama_numero).filter((n): n is number => typeof n === 'number')
                          return (
                            <div key={`rest-${guest.id}-${r.id}`} className="flex items-center justify-between px-4 py-2 border-b last:border-0 bg-white/40">
                              <div>
                                <div className="text-xs text-muted-foreground">#{r.id} · Camas {camas.join(', ') || '-'}</div>
                                <div className="text-xs">{formatDateTime(r.check_in)} → {formatDateTime(r.check_out)}</div>
                              </div>
                             
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && guests.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent className="flex flex-col items-center gap-3">
            <p className="text-base text-muted-foreground">No se encontraron huespedes.</p>
            {searchTerm && (
              <Button variant="ghost" onClick={() => void handleClearSearch()}>
                Limpiar busqueda
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default GuestsPage

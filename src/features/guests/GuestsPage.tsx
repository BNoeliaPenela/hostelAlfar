import { useState, type KeyboardEvent } from "react"
import { Search, Loader2 } from "lucide-react"
import { useGuests } from "./hooks/useGuests"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"

const GuestsPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const { guests, loading, error, searchGuests, fetchGuests } = useGuests()

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
                <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Historial de estadias</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Aun no hay estadias asociadas. Se mostraran aqui cuando se conecte con el modulo de reservas.
                  </p>
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

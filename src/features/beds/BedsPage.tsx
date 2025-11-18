import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { HostelSection } from "@/features/beds/bedComponents/HostelSection";
import { useBeds } from "@/features/beds/hooks/useBeds";
import type { BedStatus } from "@/features/beds/types/beds";
import { HOSTEL_LAYOUT, statusColors, statusLabels } from "@/lib/bedsConst";

const STATUS_ORDER: BedStatus[] = ["libre", "ocupada", "limpieza", "proceso"];

export function BedsPage() {
  const {
    beds,
    selectedBed,
    isDialogOpen,
    handleBedClick,
    handleStatusChange,
    getStatusCount,
    setIsDialogOpen,
    reloadBeds,
    loadingBeds,
    statusUpdating,
    error,
    handleCleanSelected,
  } = useBeds();

  return (
    <div className="space-y-6 p-4 lg:p-0">
      {/* Header con estadísticas */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Camas</h2>
          <Button variant="outline" size="sm" onClick={reloadBeds} disabled={loadingBeds}>
            Actualizar
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
          {STATUS_ORDER.map((status) => (
            <Badge key={status} variant="outline" className="px-3 py-2 min-w-[120px] justify-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${statusColors[status].split(" ")[0]}`} />
              <span className="text-sm">
                {statusLabels[status]}: {getStatusCount(status)}
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start justify-between gap-4">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={reloadBeds} disabled={loadingBeds}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Layout horizontal del hostel */}
      <div className="bg-gray-100 p-4 lg:p-6 rounded-lg w-full overflow-x-auto">
        {loadingBeds && beds.length === 0 ? (
          <p className="text-sm text-gray-500">Cargando estado de las camas...</p>
        ) : beds.length === 0 ? (
          <p className="text-sm text-gray-500">No hay información de camas disponible.</p>
        ) : (
          <div className="flex flex-col lg:flex-row items-center justify-center space-y-8 lg:space-y-0 lg:space-x-8 lg:min-w-max py-4">
            {HOSTEL_LAYOUT.map((section, index) => (
              <div key={section.sectionId} className="flex items-center w-full lg:w-auto">
                <HostelSection section={section} beds={beds} onBedClick={handleBedClick} />

                {index < HOSTEL_LAYOUT.length - 1 && (
                  <div className="hidden lg:block h-24 lg:h-28 w-8 lg:w-10 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 rounded-full mx-6 flex items-center justify-center">
                    <span className="text-xs text-gray-500 transform -rotate-90 whitespace-nowrap">Pasillo</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cama {selectedBed?.id} - Detalles</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div>
              <label className="text-sm font-medium">Estado actual:</label>
              <Select value={selectedBed?.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="libre" className="hover:bg-gray-200">
                    Libre
                  </SelectItem>
                  <SelectItem value="ocupada" className="hover:bg-gray-200">
                    Ocupada
                  </SelectItem>
                  <SelectItem value="limpieza" className="hover:bg-gray-200">
                    Para limpiar
                  </SelectItem>
                  <SelectItem value="proceso" className="hover:bg-gray-200">
                    En proceso
                  </SelectItem>
                </SelectContent>
              </Select>
              {statusUpdating && <p className="text-xs text-gray-500 mt-1">Actualizando estado...</p>}
            </div>

            {/* Acción rápida: limpiar cama */}
            <div className="flex items-center justify-between">
              <div />
              <Button
                variant="outline"
                size="sm"
                disabled={selectedBed?.status !== "limpieza" || statusUpdating}
                onClick={handleCleanSelected}
              >
                Marcar como limpia
              </Button>
            </div>

            {selectedBed?.guest && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Huésped actual:</h4>
                <p>
                  <strong>Nombre:</strong> {selectedBed.guest.name}
                </p>
                <p>
                  <strong>Check-in:</strong> {selectedBed.guest.checkIn}
                </p>
                <p>
                  <strong>Check-out:</strong> {selectedBed.guest.checkOut}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

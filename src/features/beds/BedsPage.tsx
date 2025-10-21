

import { Button } from "../../components/ui/Button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/Dialog"
import { Badge } from "../../components/ui/Badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select"
import type { BedStatus } from "./types/beds"
import { HOSTEL_LAYOUT, statusColors, statusLabels } from "../../lib/bedsConst"
import { HostelSection } from "./bedComponents/HostelSection"
import { useBeds } from "./hooks/useBeds"


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
    } = useBeds();
    

    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
            {/* Header con estadísticas */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Camas</h2>
                    <Button variant="outline" size="sm" onClick={reloadBeds} disabled={loadingBeds}>
                        Actualizar
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(statusLabels).map(([status, label]) => (
                        <Badge key={status} variant="outline" className="px-2 py-1">
                            <div className={` sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-2 ${statusColors[status as BedStatus].split(" ")[0]}`} />
                            <span className="text-xs sm:text-sm">{label}: {getStatusCount(status as BedStatus)}</span>
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
            <div className="bg-gray-100 p-3 sm:p-6 rounded-lg w-full overflow-auto">
                {loadingBeds && beds.length === 0 ? (
                    <p className="text-sm text-gray-500">Cargando estado de las camas...</p>
                ) : beds.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay información de camas disponible.</p>
                ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center space-x-4 sm:space-x-8 md:space-x-12 min-w-max py-4">
                        {HOSTEL_LAYOUT.map((section, index) => (
                            <div key={section.sectionId} className="flex items-center w-full">
                                <HostelSection
                                    section={section}
                                    beds={beds}
                                    onBedClick={handleBedClick}
                                />

                                {index < HOSTEL_LAYOUT.length - 1 && (
                                    <div className=" sm:h-24 md:h-28 sm:w-8 md:w-10 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 rounded-full mx-2 sm:mx-6 md:mx-6 flex items-center justify-center">
                                        <span className="text-xs text-gray-500 transform -rotate-90 hidden sm:block whitespace-nowrap">
                                            Pasillo
                                        </span>
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
                            <label className="text-sm font-medium">Estado Actual:</label>
                            <Select value={selectedBed?.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="libre" className="hover:bg-gray-200">Libre</SelectItem>
                                    <SelectItem value="ocupada" className="hover:bg-gray-200">Ocupada</SelectItem>
                                    <SelectItem value="limpieza" className="hover:bg-gray-200">Para Limpiar</SelectItem>
                                    <SelectItem value="proceso" className="hover:bg-gray-200">En Proceso</SelectItem>
                                </SelectContent>
                            </Select>
                            {statusUpdating && (
                                <p className="text-xs text-gray-500 mt-1">Actualizando estado...</p>
                            )}
                        </div>

                        {selectedBed?.guest && (
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">Huésped Actual:</h4>
                                <p><strong>Nombre:</strong> {selectedBed.guest.name}</p>
                                <p><strong>Check-in:</strong> {selectedBed.guest.checkIn}</p>
                                <p><strong>Check-out:</strong> {selectedBed.guest.checkOut}</p>
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
    )
}

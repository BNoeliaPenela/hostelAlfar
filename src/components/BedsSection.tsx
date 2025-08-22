import { useState } from "react"
import { Card, CardContent } from "./ui/Card"
import { Button } from "./ui/Button"
import { Bed, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog"
import { Badge } from "./ui/Badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select"

type BedStatus = "libre" | "ocupada" | "limpieza" | "proceso" 

interface BedData {
    id: number;
    status: BedStatus;
    guest?: {
        name: string;
        checkIn: string;
        checkOut: string;
    },
}

const statusColors = {
    libre: "bg-green-400 hover:bg-green-600",
    ocupada: "bg-red-500 hover:bg-red-600",
    limpieza: "bg-yellow-500 hover:bg-yellow-600",
    proceso: "bg-blue-500 hover:bg-blue-600",
}

const statusLabels = {
    libre: "Libre",
    ocupada: "Ocupada",
    limpieza: "Para Limpiar",
    proceso: "En Proceso",
}

export function BedsSection() {
    const [beds, setBeds] = useState<BedData[]>(() => {
        const initialBeds: BedData[] = []
        for (let i = 1; i <=24; i++){
         //los diferentes status que puede tener una cama
           const statuses: BedStatus[] = ["libre", "ocupada", "limpieza", "proceso"]
           //selecciona un status aleatorio para cada cama
           const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
            //agrega una cama con un id y un status aleatorio
            initialBeds.push({
                id: i,
                status: randomStatus,
                guest: randomStatus === "ocupada" ? {
                    name: `Huésped ${i}`,
                    //fecha de ingreso y salida aleatorias
                    checkIn: new Date().toLocaleDateString(),
                    checkOut: new Date(new Date().setDate(new Date().getDate() + 2)).toLocaleDateString(),
                } : undefined,
            })

        }
        return initialBeds
    })

    //Se declara un estado llamado selectedBed.
    //El tipo es BedData | null, o sea, puede ser un objeto con los datos de una cama o null si no hay ninguna seleccionada.
    const [selectedBed, setSelectedBed] = useState<BedData | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    //Sirve para manejar si el diálogo/modal de información está abierto o cerrado.
    const handleBedClick = (bed: BedData) => {
        setSelectedBed(bed)
        setIsDialogOpen(true)
    }

    //Sirve para cambiar el estado de una cama seleccionada.
    //Recibe un nuevo estado (newStatus) y actualiza la cama seleccionada con ese nuevo estado.
    const handleStatusChange = (newStatus: string) => {
        if (selectedBed) {
            const status = newStatus as BedStatus
            setBeds(
                beds.map((bed) =>
                bed.id === selectedBed.id ? { ...bed, status, guest: status !== "ocupada" ? undefined : bed.guest } : bed,
                ),
            )
        setSelectedBed({ ...selectedBed, status })
        }
    }
    
    //getStatusCount sirve para contar cuántas camas hay en un estado específico dentro de todo el listado de beds.
    const getStatusCount = (status: BedStatus) => {
        return beds.filter((bed) => bed.status === status).length
    }

    return (
        //Barra superior con el título y los badges de estado
        <div className="space-y-6">
            
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Camas</h2>
                <div className="flex space-x-4">
                {Object.entries(statusLabels).map(([status, label]) => (
                    <Badge key={status} variant="outline" className="px-3 py-1">
                    <div className={`w-3 h-3 rounded-full mr-2 ${statusColors[status as BedStatus].split(" ")[0]}`} />
                    {label}: {getStatusCount(status as BedStatus)}
                    </Badge>
                ))}
                </div>
            </div>

            
            <div className="grid grid-cols-6 gap-4">
                {beds.map((bed) => (
                <Card
                    key={bed.id}
                    className={`cursor-pointer transition-all hover:scale-105 ${statusColors[bed.status]} text-white`}
                    onClick={() => handleBedClick(bed)}
                >
                    <CardContent className="p-4 text-center">
                    <Bed className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-semibold">Cama {bed.id}</div>
                    <div className="text-sm opacity-90">{statusLabels[bed.status]}</div>
                    {bed.guest && (
                        <div className="text-xs mt-1 opacity-80">
                        <User className="h-3 w-3 inline mr-1" />
                        {bed.guest.name}
                        </div>
                    )}
                    </CardContent>
                </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cama {selectedBed?.id} - Detalles</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 p-6">
                        <div>
                            <label className="text-sm font-medium bg-gray-50">Estado Actual:</label>
                            <Select value={selectedBed?.status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="mt-1">
                                <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-50">
                                <SelectItem value="libre">Libre</SelectItem>
                                <SelectItem value="ocupada">Ocupada</SelectItem>
                                <SelectItem value="limpieza">Para Limpiar</SelectItem>
                                <SelectItem value="proceso">En Proceso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedBed?.guest && (
                        <div className="bg-gray-200 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Huésped Actual:</h4>
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

                        <div className="flex justify-end space-x-2">
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
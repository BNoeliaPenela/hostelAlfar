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
    };
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

// Configuración escalable del layout del hostel
const HOSTEL_LAYOUT = [
    { sectionId: 1, bunkBeds: 2, startBedId: 1 },   // Sección 1: 2 cuchetas (camas 1-4)
    { sectionId: 2, bunkBeds: 4, startBedId: 5 },   // Sección 2: 4 cuchetas (camas 5-12)  
    { sectionId: 3, bunkBeds: 4, startBedId: 13 },  // Sección 3: 4 cuchetas (camas 13-20)
    { sectionId: 4, bunkBeds: 2, startBedId: 21 },  // Sección 4: 2 cuchetas (camas 21-24)
]

// Lista de nombres realistas para huéspedes
const GUEST_NAMES = [
    "Ana García", "Carlos López", "María Rodriguez", "Juan Pérez", "Laura Martín",
    "Diego Silva", "Carmen Ruiz", "Fernando Castro", "Elena Morales", "Roberto Díaz",
    "Patricia Vega", "Miguel Torres", "Sofía Herrera", "Andrés Jiménez", "Valentina Cruz",
    "Gabriel Mendez", "Lucía Vargas", "Mateo Ramos", "Isabella Santos", "Nicolás Flores",
    "Camila Ortiz", "Santiago Reyes", "Martina Guzmán", "Tomás Guerrero"
]

const BedCard = ({ bed, onClick }: { bed: BedData, onClick: (bed: BedData) => void }) => (
    <Card
        className={`cursor-pointer transition-all hover:scale-105 ${statusColors[bed.status]} text-white w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center`}
        onClick={() => onClick(bed)}
    >
        <CardContent className="p-2 sm:p-3 text-center w-full">
            <Bed className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1" />
            <div className="font-semibold text-sm sm:text-base">C{bed.id}</div>
            {bed.guest && (
                <User className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 mx-auto mt-1 opacity-80" />
            )}
        </CardContent>
    </Card>
)

const BunkBed = ({ bed1, bed2, onBedClick }: { 
    bed1: BedData, 
    bed2: BedData, 
    onBedClick: (bed: BedData) => void 
}) => (
    // Cambiado de flex-col a flex-row
    <div className="flex flex-row gap-1"> 
        <BedCard bed={bed1} onClick={onBedClick} />
        <BedCard bed={bed2} onClick={onBedClick} />
    </div>
)
const HostelSection = ({ section, beds, onBedClick }: {
    section: typeof HOSTEL_LAYOUT[0],
    beds: BedData[],
    onBedClick: (bed: BedData) => void
}) => {
    const sectionBeds = beds.slice(section.startBedId - 1, section.startBedId - 1 + (section.bunkBeds * 2))
    
    return (
        <div className="flex flex-col items-center space-y-2">
            <span className="text-xs text-gray-600 font-medium">Sección {section.sectionId}</span>
            {/* Ahora cada "cucheta" es una fila, y las filas se apilan verticalmente */}
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-4"> {/* Cambiado a flex-col para apilar las filas de cuchetas */}
                {Array.from({ length: section.bunkBeds }, (_, i) => {
                    // bed1 y bed2 son las camas que van una al lado de la otra
                    const bed1 = sectionBeds[i * 2]
                    const bed2 = sectionBeds[i * 2 + 1]
                    return (
                        <BunkBed
                            key={`bunk-${section.sectionId}-${i}`}
                            bed1={bed1}
                            bed2={bed2}
                            onBedClick={onBedClick}
                        />
                    )
                })}
            </div>
        </div>
    )
}

export function BedsSection() {
    const [beds, setBeds] = useState<BedData[]>(() => {
        const initialBeds: BedData[] = []
        const totalBeds = HOSTEL_LAYOUT.reduce((sum, section) => sum + (section.bunkBeds * 2), 0)
        
        for (let i = 1; i <= totalBeds; i++){
            const statuses: BedStatus[] = ["libre", "ocupada", "limpieza", "proceso"]
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
            
            initialBeds.push({
                id: i,
                status: randomStatus,
                guest: randomStatus === "ocupada" ? {
                    name: GUEST_NAMES[i - 1] || `Huésped ${i}`,
                    checkIn: new Date().toLocaleDateString(),
                    checkOut: new Date(new Date().setDate(new Date().getDate() + Math.ceil(Math.random() * 7 + 1))).toLocaleDateString(),
                } : undefined,
            })
        }
        return initialBeds
    })

    const [selectedBed, setSelectedBed] = useState<BedData | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleBedClick = (bed: BedData) => {
        setSelectedBed(bed)
        setIsDialogOpen(true)
    }

    const handleStatusChange = (newStatus: string) => {
        if (selectedBed) {
            const status = newStatus as BedStatus
            setBeds(beds.map((bed) =>
                bed.id === selectedBed.id 
                    ? { 
                        ...bed, 
                        status, 
                        guest: status !== "ocupada" ? undefined : bed.guest 
                      } 
                    : bed
            ))
            setSelectedBed({ ...selectedBed, status })
        }
    }
    
    const getStatusCount = (status: BedStatus) => {
        return beds.filter((bed) => bed.status === status).length
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header con estadísticas */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Camas</h2>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(statusLabels).map(([status, label]) => (
                        <Badge key={status} variant="outline" className="px-2 py-1">
                            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-2 ${statusColors[status as BedStatus].split(" ")[0]}`} />
                            <span className="text-xs sm:text-sm">{label}: {getStatusCount(status as BedStatus)}</span>
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Layout horizontal del hostel */}
            <div className="bg-gray-100 p-3 sm:p-6 rounded-lg overflow-x-auto">
                <div className="flex items-center justify-center space-x-4 sm:space-x-8 md:space-x-12 min-w-max py-4">
                    {HOSTEL_LAYOUT.map((section, index) => (
                        <div key={section.sectionId} className="flex items-center">
                            {/* Sección de camas */}
                            <HostelSection 
                                section={section} 
                                beds={beds} 
                                onBedClick={handleBedClick} 
                            />
                            
                            {/* Pasillo (excepto después de la última sección) */}
                            {index < HOSTEL_LAYOUT.length - 1 && (
                                <div className="h-20 sm:h-24 md:h-28 w-6 sm:w-8 md:w-10 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 rounded-full mx-4 sm:mx-6 md:mx-8 flex items-center justify-center">
                                    <span className="text-xs text-gray-500 transform -rotate-90 hidden sm:block whitespace-nowrap">
                                        Pasillo
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
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
                            <Select value={selectedBed?.status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="libre">Libre</SelectItem>
                                    <SelectItem value="ocupada">Ocupada</SelectItem>
                                    <SelectItem value="limpieza">Para Limpiar</SelectItem>
                                    <SelectItem value="proceso">En Proceso</SelectItem>
                                </SelectContent>
                            </Select>
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
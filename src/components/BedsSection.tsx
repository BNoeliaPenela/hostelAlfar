import { useState } from "react"
import { Card, CardContent } from "./ui/Card"
import { Button } from "./ui/Button"
import { Bed, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog"

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

const statusColor = {
    libre: "bg-green-500 hover:bg-green-600",
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

    





}
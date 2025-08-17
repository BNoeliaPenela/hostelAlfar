import { useState } from "react"
import { Card, CardContent } from "./ui/Card"
import { Button } from "./ui/Button"


import { Bed, User } from "lucide-react"

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

    
    

}
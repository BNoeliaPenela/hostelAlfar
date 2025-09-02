import { useState } from "react";
import type { BedData, BedStatus } from "../types/beds";
import { HOSTEL_LAYOUT, GUEST_NAMES } from "../../../lib/bedsConst";

export const useBeds = () => {
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

    return {
        beds,
        selectedBed,
        isDialogOpen,
        handleBedClick,
        handleStatusChange,
        getStatusCount,
        setIsDialogOpen, // Para cerrar el diálogo desde la página
    };
}
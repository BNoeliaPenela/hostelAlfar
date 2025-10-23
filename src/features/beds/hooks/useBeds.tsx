import { useCallback, useEffect, useState } from "react"
import type { BedData, BedStatus } from "../types/beds"
import { fetchBeds, updateBedStatus, cleanBed } from "../services/bedService"

export const useBeds = () => {
    const [beds, setBeds] = useState<BedData[]>([])
    const [selectedBed, setSelectedBed] = useState<BedData | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loadingBeds, setLoadingBeds] = useState(false)
    const [statusUpdating, setStatusUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadBeds = useCallback(async () => {
        setLoadingBeds(true)
        setError(null)
        try {
            const data = await fetchBeds()
            setBeds(data)
            setSelectedBed((current) => {
                if (!current) return current
                const updated = data.find((bed) => bed.backendId === current.backendId)
                if (!updated) {
                    setIsDialogOpen(false)
                    return null
                }
                return updated
            })
        } catch (err) {
            console.error("Error cargando camas:", err)
            setError("No pudimos cargar las camas. Intenta nuevamente.")
        } finally {
            setLoadingBeds(false)
        }
    }, [setIsDialogOpen])

    useEffect(() => {
        loadBeds()
    }, [loadBeds])

    // Escucha evento global para refrescar camas (emitido desde Reservas)
    useEffect(() => {
        const handler = () => { loadBeds() }
        window.addEventListener('beds:reload', handler)
        return () => window.removeEventListener('beds:reload', handler)
    }, [loadBeds])

    const handleBedClick = (bed: BedData) => {
        if (bed.backendId <= 0) return
        setSelectedBed(bed)
        setIsDialogOpen(true)
    }

    const handleStatusChange = useCallback(async (newStatus: string) => {
        if (!selectedBed) return

        const status = newStatus as BedStatus
        setStatusUpdating(true)
        setError(null)
        try {
            await updateBedStatus(selectedBed.backendId, status)
            await loadBeds()
        } catch (err) {
            console.error("Error actualizando cama:", err)
            setError("No pudimos actualizar el estado de la cama. Intenta nuevamente.")
        } finally {
            setStatusUpdating(false)
        }
    }, [selectedBed, loadBeds])

    const handleCleanSelected = useCallback(async () => {
        if (!selectedBed) return
        setStatusUpdating(true)
        setError(null)
        try {
            await cleanBed(selectedBed.backendId)
            await loadBeds()
        } catch (err) {
            console.error("Error limpiando cama:", err)
            setError("No pudimos limpiar la cama. Intenta nuevamente.")
        } finally {
            setStatusUpdating(false)
        }
    }, [selectedBed, loadBeds])
    
    const getStatusCount = (status: BedStatus) =>
        beds.filter((bed) => bed.status === status).length

    return {
        beds,
        selectedBed,
        isDialogOpen,
        handleBedClick,
        handleStatusChange,
        getStatusCount,
        setIsDialogOpen,
        reloadBeds: loadBeds,
        loadingBeds,
        statusUpdating,
        error,
        handleCleanSelected,
    }
}

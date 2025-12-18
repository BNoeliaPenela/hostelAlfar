import { useCallback, useEffect, useState } from "react";
import type { BedData, BedStatus } from "../types/beds";
import { cleanBed, fetchBeds, updateBedStatus } from "../services/bedService";

export const useBeds = () => {
  const [beds, setBeds] = useState<BedData[]>([]);
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBeds = useCallback(async () => {
    setLoadingBeds(true);
    setError(null);
    try {
      const data = await fetchBeds();
      setBeds(data);
      setSelectedBed((current) => {
        if (!current) return current;
        const updated = data.find((bed) => bed.backendId === current.backendId);
        if (!updated) {
          setIsDialogOpen(false);
          return null;
        }
        return updated;
      });
    } catch (err) {
      console.error("Error cargando camas:", err);
      setError("No pudimos cargar las camas. Intenta nuevamente.");
    } finally {
      setLoadingBeds(false);
    }
  }, []);

  useEffect(() => {
    loadBeds();
  }, [loadBeds]);

  // Escucha evento global para refrescar camas (emitido desde Reservas)
  useEffect(() => {
    const handler = () => {
      loadBeds();
    };
    window.addEventListener("beds:reload", handler);
    return () => window.removeEventListener("beds:reload", handler);
  }, [loadBeds]);

  const handleBedClick = (bed: BedData) => {
    if (bed.backendId <= 0) return;
    setSelectedBed(bed);
    setIsDialogOpen(true);
  };

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!selectedBed) return;

      const status = newStatus as BedStatus;
      setStatusUpdating(true);
      setError(null);
      try {
        await updateBedStatus(selectedBed.backendId, status);
        await loadBeds();
      } catch (err) {
        console.error("Error actualizando cama:", err);
        setError("No pudimos actualizar el estado de la cama. Intenta nuevamente.");
      } finally {
        setStatusUpdating(false);
      }
    },
    [selectedBed, loadBeds],
  );

  const handleCleanSelected = useCallback(async (): Promise<{ ok: boolean; message?: string }> => {
    if (!selectedBed) return { ok: false, message: "No hay cama seleccionada." };
    setStatusUpdating(true);
    setError(null);
    try {
      const cleaned = await cleanBed(selectedBed.backendId);
      if (cleaned.status !== "libre" && cleaned.status !== "proceso") {
        const message = "La cama no quedó LIBRE tras limpiar. Puede existir una reserva en curso. Verifica el check-out.";
        setError(message);
        await loadBeds();
        return { ok: false, message };
      }
      await loadBeds();
      return { ok: true };
    } catch (err) {
      console.error("Error limpiando cama:", err);
      const message = "No pudimos limpiar la cama. Intenta nuevamente.";
      setError(message);
      return { ok: false, message };
    } finally {
      setStatusUpdating(false);
    }
  }, [selectedBed, loadBeds]);

  const getStatusCount = (status: BedStatus) => beds.filter((bed) => bed.status === status).length;

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
  };
};

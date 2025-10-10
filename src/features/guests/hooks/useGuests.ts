import { useState, useEffect, useCallback } from "react"
import { guestService } from "../services/guestsService"
import type { Guest, CreateGuestDTO, UpdateGuestDTO } from "../types/Guest"

interface UseGuestsReturn {
  guests: Guest[]
  loading: boolean
  error: string | null
  fetchGuests: () => Promise<void>
  searchGuests: (searchTerm: string) => Promise<void>
  createGuest: (guest: CreateGuestDTO) => Promise<Guest | null>
  updateGuest: (id: number, guest: UpdateGuestDTO) => Promise<Guest | null>
  deleteGuest: (id: number) => Promise<boolean>
  getGuestById: (id: number) => Promise<Guest | null>
}

export const useGuests = (): UseGuestsReturn => {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGuests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await guestService.getAll()
      setGuests(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar huespedes"
      setError(errorMessage)
      console.error("Error fetching guests:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const searchGuests = useCallback(
    async (searchTerm: string) => {
      const term = searchTerm.trim()

      if (!term) {
        await fetchGuests()
        return
      }

      setLoading(true)
      setError(null)
      try {
        const data = await guestService.search(term)
        setGuests(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al buscar huespedes"
        setError(errorMessage)
        console.error("Error searching guests:", err)
      } finally {
        setLoading(false)
      }
    },
    [fetchGuests],
  )

  const createGuest = useCallback(async (guest: CreateGuestDTO): Promise<Guest | null> => {
    setLoading(true)
    setError(null)
    try {
      const newGuest = await guestService.create(guest)
      setGuests((prev) => [...prev, newGuest])
      return newGuest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear huesped"
      setError(errorMessage)
      console.error("Error creating guest:", err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateGuest = useCallback(async (id: number, guest: UpdateGuestDTO): Promise<Guest | null> => {
    setLoading(true)
    setError(null)
    try {
      const updatedGuest = await guestService.update(id, guest)
      setGuests((prev) => prev.map((item) => (item.id === id ? updatedGuest : item)))
      return updatedGuest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar huesped"
      setError(errorMessage)
      console.error("Error updating guest:", err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteGuest = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await guestService.delete(id)
      setGuests((prev) => prev.filter((guest) => guest.id !== id))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar huesped"
      setError(errorMessage)
      console.error("Error deleting guest:", err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const getGuestById = useCallback(async (id: number): Promise<Guest | null> => {
    setLoading(true)
    setError(null)
    try {
      const guest = await guestService.getById(id)
      return guest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al obtener huesped"
      setError(errorMessage)
      console.error("Error getting guest:", err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGuests().catch((err) => console.error("Error inicial al cargar huespedes:", err))
  }, [fetchGuests])

  return {
    guests,
    loading,
    error,
    fetchGuests,
    searchGuests,
    createGuest,
    updateGuest,
    deleteGuest,
    getGuestById,
  }
}

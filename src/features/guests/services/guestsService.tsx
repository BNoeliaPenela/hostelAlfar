import axios from "axios"
import apiClient from "@/lib/apiClient"
import type { Guest, CreateGuestDTO, UpdateGuestDTO } from "../types/Guest"

const GUESTS_ENDPOINT = "clientes/"

interface ErrorPayload {
  detail?: string
  message?: string
  error?: string
}

class GuestService {
  private ensureAuthenticated() {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      throw new Error("Debes iniciar sesion para continuar.")
    }
  }

  private handleError(error: unknown, fallbackMessage: string): never {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error("Tu sesion expiro o no tienes permisos. Vuelve a iniciar sesion.")
      }

      const payload = error.response?.data as ErrorPayload | undefined
      const message = payload?.detail ?? payload?.message ?? payload?.error
      if (message) {
        throw new Error(message)
      }
    }

    throw new Error(fallbackMessage)
  }

  async getAll(): Promise<Guest[]> {
    this.ensureAuthenticated()

    try {
      const response = await apiClient.get<Guest[]>(GUESTS_ENDPOINT)
      return response.data
    } catch (error) {
      this.handleError(error, "No se pudieron obtener los huespedes.")
    }
  }

  async getById(id: number): Promise<Guest> {
    this.ensureAuthenticated()

    try {
      const response = await apiClient.get<Guest>(`${GUESTS_ENDPOINT}${id}/`)
      return response.data
    } catch (error) {
      this.handleError(error, "No se pudo obtener el huesped solicitado.")
    }
  }

  async create(guest: CreateGuestDTO): Promise<Guest> {
    this.ensureAuthenticated()

    try {
      const response = await apiClient.post<Guest>(GUESTS_ENDPOINT, guest)
      return response.data
    } catch (error) {
      this.handleError(error, "No se pudo crear el huesped.")
    }
  }

  async update(id: number, guest: UpdateGuestDTO): Promise<Guest> {
    this.ensureAuthenticated()

    try {
      const response = await apiClient.patch<Guest>(`${GUESTS_ENDPOINT}${id}/`, guest)
      return response.data
    } catch (error) {
      this.handleError(error, "No se pudo actualizar el huesped.")
    }
  }

  async delete(id: number): Promise<void> {
    this.ensureAuthenticated()

    try {
      await apiClient.delete(`${GUESTS_ENDPOINT}${id}/`)
    } catch (error) {
      this.handleError(error, "No se pudo eliminar el huesped.")
    }
  }

  async search(searchTerm: string): Promise<Guest[]> {
    const term = searchTerm.trim()

    if (!term) {
      return this.getAll()
    }

    this.ensureAuthenticated()

    try {
      const response = await apiClient.get<Guest[]>(GUESTS_ENDPOINT, {
        params: { search: term },
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return []
      }
      this.handleError(error, "No se pudo realizar la busqueda de huespedes.")
    }
  }
}

export const guestService = new GuestService()

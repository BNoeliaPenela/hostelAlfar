// src/features/calendar/services/calendarService.ts
import { eachDayOfInterval, format, parseISO } from "date-fns";
import apiClient from "../../../lib/apiClient";

export interface Reservation {
  id: number;
  cliente: string;
  cama: number;
  check_in: string; // formato "YYYY-MM-DD HH:MM"
  check_out: string;
}

export interface DayData {
  date: string;
  occupied: number;
  total: number;
  reservations: {
    name: string;
    bed: number;
    from: string;
    to: string;
  }[];
}

export const calendarService = {
  async fetchReservations(): Promise<Reservation[]> {
    const res = await apiClient.get("/reservas/");
    return res.data;
  },

  // Convierte reservas en un mapa de días -> ocupación + reservas
  mapReservationsByDay(reservations: Reservation[], totalBeds: number = 24): Record<string, DayData> {
    const map: Record<string, DayData> = {};

    reservations.forEach((r) => {
      // Usamos date-fns para parsear las fechas
      const checkInDate = parseISO(r.check_in.replace(" ", "T"));
      const checkOutDate = parseISO(r.check_out.replace(" ", "T"));

      // Generamos un array de días entre check-in y check-out (excluyendo el día de checkout)
      const days = eachDayOfInterval({ start: checkInDate, end: checkOutDate });

      // Agregamos la reserva a cada uno de esos días
      days.forEach(day => {
        const dateKey = format(day, "yyyy-MM-dd");

        // Si el día no existe en el mapa, lo inicializamos
        if (!map[dateKey]) {
          map[dateKey] = {
            date: dateKey,
            occupied: 0,
            total: totalBeds,
            reservations: [],
          };
        }
        
        // Sumamos la ocupación y agregamos la reserva
        map[dateKey].occupied += 1;
        map[dateKey].reservations.push({
          name: r.cliente,
          bed: r.cama,
          from: r.check_in,
          to: r.check_out,
        });
      });
    });

    return map;
  },
};
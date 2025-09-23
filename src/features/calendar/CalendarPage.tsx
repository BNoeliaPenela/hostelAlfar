// src/pages/CalendarPage.tsx
import React, { useState, useEffect } from "react";
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isBefore, 
  isSameDay, 
  getDay,
  parseISO, // Importamos para formatear las fechas de reserva
} from "date-fns";
import { es } from "date-fns/locale";
import Modal from "../../components/ui/Modal";
import { calendarService } from "./services/calendarService";

// Actualizamos el tipo Reservation para que refleje la información del cliente
// asumiendo que el backend ahora devuelve un objeto de cliente en lugar de un ID
type Reservation = { name: string; bed: number; from: string; to: string };
type DayData = { date: string; occupied: number; total: number; reservations?: Reservation[]; };

const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const CalendarPage: React.FC = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [reservationsMap, setReservationsMap] = useState<Record<string, DayData>>({});

  const firstDay = startOfMonth(new Date(currentYear, currentMonth));
  const lastDay = endOfMonth(new Date(currentYear, currentMonth));
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });
  const startWeekday = getDay(firstDay);
  const leadingSlots = Array.from({ length: startWeekday });
  const totalCells = startWeekday + daysInMonth.length;
  const trailingSlots = (7 - (totalCells % 7)) % 7;

  // Función para recargar los datos del calendario
  const fetchAndMapReservations = async () => {
    try {
      const reservations = await calendarService.fetchReservations();
      const map = calendarService.mapReservationsByDay(reservations, 24);
      setReservationsMap(map);
    } catch (err) {
      console.error("Error cargando reservas:", err);
    }
  };

  useEffect(() => {
    // Se ejecuta una vez al montar el componente
    fetchAndMapReservations();
  }, []);

  const changeMonth = (dir: "prev" | "next") => {
    const delta = dir === "next" ? 1 : -1;
    const newDate = new Date(currentYear, currentMonth + delta, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  };

  const getStatusColor = (occupied: number, total: number) => {
    const ratio = occupied / total;
    if (ratio === 1) return "bg-red-500 text-white";
    if (ratio >= 0.5) return "bg-yellow-300";
    return "bg-green-300";
  };

  const getDayData = (d: Date): DayData | null => {
    const key = format(d, "yyyy-MM-dd");
    return reservationsMap[key] ?? null;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={() => changeMonth("prev")}>
          ←
        </button>
        <h1 className="text-2xl font-semibold">
          {format(firstDay, "MMMM yyyy", { locale: es })}
        </h1>
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={() => changeMonth("next")}>
            →
          </button>
        </div>
      </div>
      {/* Cabecera de días */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((w) => (
          <div key={w} className="text-center font-semibold text-gray-700">
            {w}
          </div>
        ))}
      </div>
      {/* Celdas del calendario */}
      <div className="grid grid-cols-7 gap-3">
        {leadingSlots.map((_, i) => (
          <div key={`empty-start-${i}`} />
        ))}
        {daysInMonth.map((day) => {
          const isPast = isBefore(day, today) && !isSameDay(day, today);
          const data = getDayData(day);
          const baseClasses = "h-20 rounded-lg flex flex-col items-center justify-center shadow";
          const classes = isPast ? "bg-gray-300 text-gray-500 cursor-not-allowed" : data ? getStatusColor(data.occupied, data.total) : "bg-green-200";

          return (
            <button
              key={format(day, "yyyy-MM-dd")}
              disabled={isPast}
              onClick={() =>
                setSelectedDay(
                  data ?? {
                    date: format(day, "yyyy-MM-dd"),
                    occupied: 0,
                    total: 24,
                  }
                )
              }
              className={`${baseClasses} ${classes}`}
              title={format(day, "eeee d 'de' MMMM", { locale: es })}
            >
              <span className="font-medium">{format(day, "d")}</span>
              <span className="text-sm">
                {data ? `${data.occupied}/${data.total}` : "0/24"}
              </span>
            </button>
          );
        })}
        {Array.from({ length: trailingSlots }).map((_, i) => (
          <div key={`empty-end-${i}`} />
        ))}
      </div>
      {/* Modal de detalles del día */}
      <Modal isOpen={!!selectedDay} onClose={() => setSelectedDay(null)}>
        {selectedDay && (
          <div>
            <h2 className="text-lg font-semibold mb-2"> Detalles del {format(new Date(selectedDay.date), "dd/MM/yy")} </h2>
            <p className="mb-4"> Ocupación: {selectedDay.occupied}/{selectedDay.total} camas </p>
            {selectedDay.reservations && selectedDay.reservations.length > 0 ? (
              <div className="max-h-60 overflow-y-auto pr-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                <ul className="space-y-2">
                  {selectedDay.reservations.map((r, idx) => (
                    <li key={idx} className="flex flex-col justify-start border p-3 rounded-md">
                      <div className="flex justify-between items-center w-full mb-1">
                        <p className="font-medium text-lg">{r.name}</p>
                        <span className="px-2 py-1 text-sm bg-gray-200 rounded">
                          Cama {r.bed}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Check-in:</span>{" "}
                          {format(parseISO(r.from.replace(' ', 'T')), 'dd/MM HH:mm', { locale: es })}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Check-out:</span>{" "}
                          {format(parseISO(r.to.replace(' ', 'T')), 'dd/MM HH:mm', { locale: es })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500">No hay reservas activas</p>
            )}
            <button onClick={() => setSelectedDay(null)} className="mt-4 w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900">
              Cerrar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CalendarPage;
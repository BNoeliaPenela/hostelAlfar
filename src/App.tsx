// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ReservationPage from "./features/reservations/ReservationPage";
import CalendarPage from "./features/calendar/CalendarPage";
import GuestsPage from "./features/guests/GuestsPage";
import ReportsPage from "./features/reports/ReportsPage";
import LoginPage from "./features/auth/LoginPage";
import { BedsPage } from "./features/beds/BedsPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Layout principal con Sidebar */}
      <Route path="/home" element={<HomePage />}>
        <Route index element={<BedsPage />} />   {/* 👈 ruta inicial */}
        <Route path="camas" element={<BedsPage />} />  
        <Route path="reservas" element={<ReservationPage />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="huespedes" element={<GuestsPage />} />
        <Route path="reportes" element={<ReportsPage />} />
      </Route>

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ReservationPage from "./pages/ReservationPage";
import CalendarPage from "./pages/CalendarPage";
import GuestsPage from "./pages/GuestsPage";
import ReportsPage from "./pages/ReportsPage";
import LoginPage from "./pages/LoginPage";
import { BedsSection } from "./components/BedsSection";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Layout principal con Sidebar */}
      <Route path="/home" element={<HomePage />}>
        <Route index element={<BedsSection />} />   {/* 👈 ruta inicial */}
        <Route path="reservas" element={<ReservationPage />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="huespedes" element={<GuestsPage />} />
        <Route path="reportes" element={<ReportsPage />} />
      </Route>

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;

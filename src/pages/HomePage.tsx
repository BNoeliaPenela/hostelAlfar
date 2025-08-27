// src/pages/HomePage.tsx
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";

export default function HomePage() {
  const nav = useNavigate();

  const logout = () => {
    sessionStorage.removeItem("authed");
    nav("/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 p-6">
        {/* Header común */}
        <header className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Panel Principal</h2>
          <div className="flex items-center gap-2">
            <button
              className="border px-3 py-1 rounded hover:bg-gray-100"
              onClick={() => window.location.reload()}
            >
              Refrescar
            </button>
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Aquí se renderizan las páginas hijas */}
        <section className="card p-4 min-h-[500px]">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

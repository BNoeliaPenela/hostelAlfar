// src/pages/HomePage.tsx
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import { AppHeader } from "@/components/layout/AppHeader";

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar escritorio */}
      <div className="hidden lg:block lg:w-64 lg:min-h-screen lg:border-r lg:border-gray-200">
        <Sidebar />
      </div>

      {/* Sidebar móvil */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-200 ${
          isSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isSidebarOpen}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setIsSidebarOpen(false)} />
        <div
          className={`absolute left-0 top-0 bottom-0 w-72 max-w-[80%] bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-200 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
        </div>
      </div>

      {/* Contenido principal */}
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <AppHeader title="Panel Principal" onMenuClick={() => setIsSidebarOpen(true)} />
        <section className="card p-4 sm:p-6 min-h-[500px]">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

// src/pages/HomePage.tsx
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { AppHeader } from "@/components/layout/AppHeader";

export default function HomePage() {
  

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar fijo */}
      <div className="w-full md:w-64 p-4 md:p-0">
        <Sidebar />
      </div>
      

      {/* Contenido principal */}
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        {/* Header común */}
        
        <AppHeader title="Panel Principal" />
        {/* Aquí se renderizan las páginas hijas */}
        <section className="card p-4 sm:p-6 min-h-[500px]">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

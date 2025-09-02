// src/pages/HomePage.tsx
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { AppHeader } from "@/components/layout/AppHeader";

export default function HomePage() {
  

  return (
    <div className="min-h-screen flex">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 p-6">
        {/* Header común */}
        
        <AppHeader title="Panel Principal" />
        {/* Aquí se renderizan las páginas hijas */}
        <section className="card p-4 min-h-[500px]">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

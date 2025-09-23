//encabezado que se puede reutilizar en las diferentes páginas
//incluye título, botón de refrescar y cerrar sesión
import { useAuth } from "@/hooks/useAuth";

interface AppHeaderProps {
    title: string;
}

export const AppHeader = ({ title }: AppHeaderProps) => {
    const { logout } = useAuth();
    return (
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="border px-3 py-1 rounded hover:bg-gray-100 text-sm sm:text-base"
              onClick={() => window.location.reload()}
            >
              Refrescar
            </button>
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm sm:text-base"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </div>
        </header>
    )
}
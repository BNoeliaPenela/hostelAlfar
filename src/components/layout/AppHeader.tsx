//encabezado que se puede reutilizar en las diferentes páginas
//incluye título, botón de refrescar y cerrar sesión
import { useAuth } from "@/hooks/useAuth";

interface AppHeaderProps {
    title: string;
}

export const AppHeader = ({ title }: AppHeaderProps) => {
    const { logout } = useAuth();
    return (
        <header className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </div>
        </header>
    )
}
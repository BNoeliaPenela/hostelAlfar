// encabezado reutilizable para las distintas páginas del panel
import { useAuth } from "@/hooks/useAuth";

interface AppHeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export const AppHeader = ({ title, onMenuClick }: AppHeaderProps) => {
  const { logout } = useAuth();

  return (
    <header className="flex items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Abrir menú"
          onClick={onMenuClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <line x1="3" x2="21" y1="6" y2="6" />
            <line x1="3" x2="21" y1="12" y2="12" />
            <line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </button>
        <h2 className="text-lg lg:text-xl font-semibold truncate">{title}</h2>
      </div>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium min-w-[110px]"
        onClick={logout}
      >
        Cerrar sesión
      </button>
    </header>
  );
};

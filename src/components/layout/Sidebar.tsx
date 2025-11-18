import { useNavigate } from "react-router-dom";

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const nav = useNavigate();

  const Item = ({ to, label }: { to: string; label: string }) => (
    <button
      onClick={() => {
        nav(to);
        onNavigate?.();
      }}
      className="w-full text-left px-4 py-3 lg:py-2 rounded-lg hover:bg-gray-100 text-base lg:text-sm transition-colors"
    >
      {label}
    </button>
  );

  return (
    <aside className="bg-white w-full lg:w-64 lg:min-h-screen p-4 lg:border-r lg:border-gray-200">
      <h1 className="text-lg font-bold mb-4 lg:mb-6">Hostel Alfar</h1>
      <nav className="flex flex-col gap-2">
        <Item to="/home/camas" label="Camas" />
        <Item to="/home/reservas" label="Reservas" />
        <Item to="/home/calendario" label="Calendario" />
        <Item to="/home/huespedes" label="Huespedes" />
        <Item to="/home/reportes" label="Reportes" />
      </nav>
    </aside>
  );
}

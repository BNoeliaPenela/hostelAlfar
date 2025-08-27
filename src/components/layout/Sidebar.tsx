import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const nav = useNavigate();

  const Item = ({ to, label }: { to: string; label: string }) => (
    <button
      onClick={() => nav(to)}
      className="w-full text-left px-4 py-2 rounded hover:bg-gray-200"
    >
      {label}
    </button>
  );

  return (
    <aside className="bg-white w-56 p-4 border-r border-gray-200 min-h-screen">
      <h1 className="text-lg font-bold mb-6">Hostel Alfar</h1>
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

import { useState } from "react"
import { Button } from "./ui/Button"
import { Bed, Calendar, Users, History, BookOpen, LogOut, Building2 } from "lucide-react"
import { BedsSection } from "./BedsSection"

type Section = "camas" | "reservas" | "huespedes" | "calendario" | "historial"

export function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>("camas")

  const menuItems = [
    { id: "camas" as Section, label: "Camas", icon: Bed },
    { id: "reservas" as Section, label: "Reservas", icon: BookOpen },
    { id: "huespedes" as Section, label: "Huéspedes", icon: Users },
    { id: "calendario" as Section, label: "Calendario", icon: Calendar },
    { id: "historial" as Section, label: "Historial", icon: History },
  ]

  const renderSection = () => {
    switch (activeSection) {
      case "camas":
        return <BedsSection />
      /*case "reservas":
        return <ReservationsSection />
      case "huespedes":
        return <GuestsSection />
      case "calendario":
        return <CalendarSection />
      case "historial":
        return <HistorySection />*/
      default:
        return <BedsSection />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Hostel Cápsula</h1>
          </div>
          <Button variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection(item.id)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{renderSection()}</main>
      </div>
    </div>
  )

}
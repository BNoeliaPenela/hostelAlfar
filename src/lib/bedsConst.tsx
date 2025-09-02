export const statusColors = {
    libre: "bg-green-400 hover:bg-green-600",
    ocupada: "bg-red-500 hover:bg-red-600",
    limpieza: "bg-yellow-500 hover:bg-yellow-600",
    proceso: "bg-blue-500 hover:bg-blue-600",
}

export const statusLabels = {
    libre: "Libre",
    ocupada: "Ocupada",
    limpieza: "Para Limpiar",
    proceso: "En Proceso",
}

// Configuración escalable del layout del hostel
export const HOSTEL_LAYOUT = [
    { sectionId: 1, bunkBeds: 2, startBedId: 1 },   // Sección 1: 2 cuchetas (camas 1-4)
    { sectionId: 2, bunkBeds: 4, startBedId: 5 },   // Sección 2: 4 cuchetas (camas 5-12)  
    { sectionId: 3, bunkBeds: 4, startBedId: 13 },  // Sección 3: 4 cuchetas (camas 13-20)
    { sectionId: 4, bunkBeds: 2, startBedId: 21 },  // Sección 4: 2 cuchetas (camas 21-24)
]

// Lista de nombres realistas para huéspedes
export const GUEST_NAMES = [
    "Ana García", "Carlos López", "María Rodriguez", "Juan Pérez", "Laura Martín",
    "Diego Silva", "Carmen Ruiz", "Fernando Castro", "Elena Morales", "Roberto Díaz",
    "Patricia Vega", "Miguel Torres", "Sofía Herrera", "Andrés Jiménez", "Valentina Cruz",
    "Gabriel Mendez", "Lucía Vargas", "Mateo Ramos", "Isabella Santos", "Nicolás Flores",
    "Camila Ortiz", "Santiago Reyes", "Martina Guzmán", "Tomás Guerrero"
]
export type BedStatus = "libre" | "ocupada" | "limpieza" | "proceso"

export type BedApiStatus = "LIBRE" | "OCUPADA" | "PARA_LIMPIAR" | "EN_PROCESO"

export interface BedData {
    /** Numero visible para la cama (coincide con el layout) */
    id: number
    /** Identificador interno del backend */
    backendId: number
    /** Estado normalizado que usa la UI */
    status: BedStatus
    /** Estado original devuelto por el backend */
    backendStatus: BedApiStatus
    guest?: {
        name: string
        checkIn: string
        checkOut: string
    }
}

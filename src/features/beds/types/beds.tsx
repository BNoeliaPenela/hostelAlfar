export type BedStatus = "libre" | "ocupada" | "limpieza" | "proceso" 

export interface BedData {
    id: number;
    status: BedStatus;
    guest?: {
        name: string;
        checkIn: string;
        checkOut: string;
    };
}
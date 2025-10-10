export interface Guest {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  direccion: string;
  patente?: string;
}

export interface CreateGuestDTO {
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  direccion: string;
  patente?: string;
}

export interface UpdateGuestDTO {
  nombre?: string;
  apellido?: string;
  documento?: string;
  telefono?: string;
  direccion?: string;
  patente?: string;
}

export interface GuestFilters {
  search?: string;
}
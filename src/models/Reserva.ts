export enum StatusReserva {
  PENDENTE = 'PENDENTE',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA'
}

export interface Reserva {
  id: string;
  caronaId: string;
  passageiroId: string;
  status: StatusReserva;
  quantidadePessoas: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateReservaDTO = Omit<Reserva, "id" | "createdAt" | "updatedAt" | "status">
export type UpdateReservaDTO = { status: StatusReserva }
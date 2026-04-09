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
  createdAt: Date;
  updatedAt: Date;
}

export enum StatusCarona {
  AGENDADA = 'AGENDADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA'
}

export interface Carona {
  id: string;
  motoristaId: string;
  veiculoId: string;
  origem: string;
  destino: string;
  dataHoraSaida: Date;
  assentosDisponiveis: number;
  status: StatusCarona;
  createdAt: Date;
  updatedAt: Date;
}

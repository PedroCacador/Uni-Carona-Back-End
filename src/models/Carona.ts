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
  valorAjuda?: number;
  status: StatusCarona;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCaronaDTO {
  motoristaId: string;
  veiculoId: string;
  origem: string;
  destino: string;
  dataHoraSaida: string | Date;
  assentosDisponiveis: number;
  valorAjuda?: number;
}

export interface UpdateCaronaDTO {
  origem?: string;
  destino?: string;
  dataHoraSaida?: string | Date;
  assentosDisponiveis?: number;
  valorAjuda?: number;
  status?: StatusCarona;
}

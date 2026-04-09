export interface Veiculo {
  id: string;
  proprietarioId: string;
  placa: string;
  marca: string;
  modelo: string;
  cor: string;
  capacidadeAssentos: number;
  createdAt: Date;
  updatedAt: Date;
}

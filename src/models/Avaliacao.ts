export interface Avaliacao {
  id: string;
  caronaId: string;
  avaliadorId: string;
  avaliadoId: string;
  nota: number;
  comentario?: string;
  createdAt: Date;
  updatedAt: Date;
}

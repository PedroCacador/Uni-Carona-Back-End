export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  whatsapp: string;
  curso: string;
  status: 'ATIVO' | 'INATIVO';
  mediaAvaliacao: number;
  totalAvaliacoes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  dataNascimento: Date;
  senhaHash: string;
  whatsapp: string;
  curso: string;
  status: 'ATIVO' | 'INATIVO';
  mediaAvaliacao: number;
  totalAvaliacoes: number;
  createdAt: Date;
  updatedAt: Date;
}

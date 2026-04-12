import { Veiculo } from '../generated/prisma/client';

export type CreateVeiculoDTO = Omit<Veiculo, "id" | "createdAt" | "updatedAt">;
export type UpdateVeiculoDTO = Partial<CreateVeiculoDTO>;

export interface IVeiculoRepository {
  create(data: CreateVeiculoDTO): Promise<Veiculo>;
  findAll(params?: any): Promise<Veiculo[]>;
  findById(id: string, include?: any): Promise<Veiculo | null>;
  findByPlaca(placa: string): Promise<Veiculo | null>;
  findByProprietario(proprietarioId: string): Promise<Veiculo | null>;
  update(id: string, data: UpdateVeiculoDTO): Promise<Veiculo>;
  delete(id: string): Promise<Veiculo>;
}

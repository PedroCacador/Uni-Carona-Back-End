import { Veiculo } from '../generated/prisma/client';
import { IVeiculoRepository, CreateVeiculoDTO, UpdateVeiculoDTO } from '../repositories/IVeiculoRepository';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';

export class VeiculoService {
  constructor(
    private readonly veiculoRepository: IVeiculoRepository,
    private readonly usuarioRepository: IUsuarioRepository // Para checar se usuário existe é opcional mas recomendado
  ) { }

  async create(data: CreateVeiculoDTO): Promise<Veiculo> {
    if (!data.placa || !data.marca || !data.modelo || !data.cor || !data.proprietarioId) {
      throw new Error('Todos os campos são obrigatórios: placa, marca, modelo, cor, proprietarioId.');
    }

    const usuario = await this.usuarioRepository.findById(data.proprietarioId);
    if (!usuario || usuario.status === 'INATIVO') {
      throw new Error('Proprietário não encontrado ou inativo.');
    }

    const veiculosExistentes = await this.veiculoRepository.findByProprietario(data.proprietarioId);
    if (veiculosExistentes.length > 0) {
      throw new Error('Este proprietário já possui um veículo cadastrado.');
    }

    const placaExistente = await this.veiculoRepository.findByPlaca(data.placa);
    if (placaExistente) {
      throw new Error('Já existe um veículo com esta placa.');
    }

    return this.veiculoRepository.create(data);
  }

  async findAll(): Promise<Veiculo[]> {
    return this.veiculoRepository.findAll();
  }

  async findById(id: string): Promise<Veiculo> {
    const veiculo = await this.veiculoRepository.findById(id);
    if (!veiculo) {
      throw new Error('Veículo não encontrado.');
    }
    return veiculo;
  }

  async findByProprietario(proprietarioId: string): Promise<Veiculo[]> {
    return this.veiculoRepository.findByProprietario(proprietarioId);
  }

  async update(id: string, data: UpdateVeiculoDTO): Promise<Veiculo> {
    const veiculoOriginal = await this.findById(id);

    if (data.placa && data.placa !== veiculoOriginal.placa) {
      const placaExistente = await this.veiculoRepository.findByPlaca(data.placa);
      if (placaExistente) {
        throw new Error('Já existe um veículo com esta placa.');
      }
    }

    if (data.proprietarioId && data.proprietarioId !== veiculoOriginal.proprietarioId) {
      throw new Error('Não é possível alterar o proprietário de um veículo.');
    }

    return this.veiculoRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.veiculoRepository.delete(id);
  }
}

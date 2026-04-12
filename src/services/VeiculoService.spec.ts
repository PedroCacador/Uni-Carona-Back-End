import { VeiculoService } from './VeiculoService';
import { IVeiculoRepository, CreateVeiculoDTO } from '../repositories/IVeiculoRepository';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';
import { Veiculo } from '../generated/prisma/client';

describe('VeiculoService', () => {
  let veiculoService: VeiculoService;
  let veiculoRepositoryMock: jest.Mocked<IVeiculoRepository>;
  let usuarioRepositoryMock: jest.Mocked<IUsuarioRepository>;

  const mockVeiculo: Veiculo = {
    id: '1',
    placa: 'ABC-1234',
    marca: 'Fiat',
    modelo: 'Uno',
    cor: 'Prata',
    proprietarioId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUsuario = {
    id: 'user1',
    nome: 'João da Silva',
    email: 'joao@teste.com',
    cpf: '12345678900',
    whatsapp: '11999999999',
    curso: 'Engenharia',
    senha: 'hash_senha123',
    dataNascimento: new Date(),
    status: 'ATIVO' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    veiculoRepositoryMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByPlaca: jest.fn(),
      findByProprietario: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    usuarioRepositoryMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn()
    };

    veiculoService = new VeiculoService(veiculoRepositoryMock, usuarioRepositoryMock);
  });

  describe('create', () => {
    const createDto: CreateVeiculoDTO = {
      placa: 'ABC-1234',
      marca: 'Fiat',
      modelo: 'Uno',
      cor: 'Prata',
      proprietarioId: 'user1'
    };

    it('Deve lançar erro se os campos obrigatórios estiverem vazios', async () => {
      await expect(veiculoService.create({ ...createDto, placa: '' })).rejects.toThrow('Todos os campos são obrigatórios');
    });

    it('Deve lançar erro se o usuário (proprietário) não existir', async () => {
      usuarioRepositoryMock.findById.mockResolvedValueOnce(null);
      await expect(veiculoService.create(createDto)).rejects.toThrow('Proprietário não encontrado ou inativo.');
    });

    it('Deve lançar erro se o proprietário já possuir veículo', async () => {
      usuarioRepositoryMock.findById.mockResolvedValueOnce(mockUsuario);
      veiculoRepositoryMock.findByProprietario.mockResolvedValueOnce(mockVeiculo);
      await expect(veiculoService.create(createDto)).rejects.toThrow('Este proprietário já possui um veículo cadastrado.');
    });

    it('Deve lançar erro se a placa já existir', async () => {
      usuarioRepositoryMock.findById.mockResolvedValueOnce(mockUsuario);
      veiculoRepositoryMock.findByProprietario.mockResolvedValueOnce(null);
      veiculoRepositoryMock.findByPlaca.mockResolvedValueOnce(mockVeiculo);
      await expect(veiculoService.create(createDto)).rejects.toThrow('Já existe um veículo com esta placa.');
    });

    it('Deve criar um veículo com sucesso', async () => {
      usuarioRepositoryMock.findById.mockResolvedValueOnce(mockUsuario);
      veiculoRepositoryMock.findByProprietario.mockResolvedValueOnce(null);
      veiculoRepositoryMock.findByPlaca.mockResolvedValueOnce(null);
      veiculoRepositoryMock.create.mockResolvedValueOnce(mockVeiculo);

      const result = await veiculoService.create(createDto);
      expect(veiculoRepositoryMock.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockVeiculo);
    });
  });

  describe('update', () => {
    it('Deve lançar erro ao tentar alterar o proprietarioId', async () => {
        veiculoRepositoryMock.findById.mockResolvedValueOnce(mockVeiculo);
        await expect(veiculoService.update('1', { proprietarioId: 'different_user' })).rejects.toThrow('Não é possível alterar o proprietário de um veículo.');
    });

    it('Deve verificar colisão de placa e lançar erro caso exista num update de placa', async () => {
        veiculoRepositoryMock.findById.mockResolvedValueOnce(mockVeiculo); // Veiculo com placa ABC-1234
        veiculoRepositoryMock.findByPlaca.mockResolvedValueOnce({ ...mockVeiculo, id: '2', placa: 'DEF-5678' }); // Simulando placa nova pertencendo a outro db entry

        await expect(veiculoService.update('1', { placa: 'DEF-5678' })).rejects.toThrow('Já existe um veículo com esta placa.');
    });

    it('Deve alterar de forma bem-sucedida', async () => {
        veiculoRepositoryMock.findById.mockResolvedValueOnce(mockVeiculo);
        veiculoRepositoryMock.update.mockResolvedValueOnce({ ...mockVeiculo, cor: 'Azul' });

        const result = await veiculoService.update('1', { cor: 'Azul' });
        expect(result.cor).toBe('Azul');
        expect(veiculoRepositoryMock.update).toHaveBeenCalledWith('1', { cor: 'Azul' });
    });
  });
});

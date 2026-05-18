import { AvaliacaoService } from './AvaliacaoService';
import { IAvaliacaoRepository } from '../repositories/IAvaliacaoRepository';
import { CaronaRepository } from '../repositories/CaronaRepository';
import { ReservaRepository } from '../repositories/ReservaRepository';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';
import { StatusCarona, StatusReserva } from '../generated/prisma/client';

describe('AvaliacaoService', () => {
  let avaliacaoService: AvaliacaoService;
  let avaliacaoRepositoryMock: jest.Mocked<IAvaliacaoRepository>;
  let caronaRepositoryMock: jest.Mocked<CaronaRepository>;
  let reservaRepositoryMock: jest.Mocked<ReservaRepository>;
  let usuarioRepositoryMock: jest.Mocked<IUsuarioRepository>;

  const mockAvaliacao = {
    id: '1',
    caronaId: 'carona1',
    avaliadorId: 'user1',
    avaliadoId: 'user2',
    nota: 5,
    comentario: 'Ótima carona!',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCarona = {
    id: 'carona1',
    origem: 'A',
    destino: 'B',
    dataHoraSaida: new Date(),
    assentosDisponiveis: 3,
    valorAjuda: null,
    status: StatusCarona.FINALIZADA,
    motoristaId: 'user1',
    veiculoId: 'veiculo1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockReserva = {
    id: 'reserva1',
    status: StatusReserva.CONFIRMADA,
    quantidadePessoas: 1,
    caronaId: 'carona1',
    usuarioId: 'user2',
    passageiroId: 'user2', // Usando os dois por causa da tipagem hibrida
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    avaliacaoRepositoryMock = {
      create: jest.fn(),
      findByCaronaAndUsers: jest.fn(),
      findByAvaliadoId: jest.fn()
    };

    caronaRepositoryMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByMotorista: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      updateAssentos: jest.fn(),
      softDelete: jest.fn()
    } as any;

    reservaRepositoryMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCaronaId: jest.fn(),
      findByUsuarioId: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn()
    } as any;

    usuarioRepositoryMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn()
    };

    avaliacaoService = new AvaliacaoService(
      avaliacaoRepositoryMock,
      caronaRepositoryMock,
      reservaRepositoryMock,
      usuarioRepositoryMock
    );
  });

  describe('criarAvaliacao', () => {
    const createData = {
      caronaId: 'carona1',
      avaliadorId: 'user1',
      avaliadoId: 'user2',
      nota: 5,
      comentario: 'Muito bom!'
    };

    it('Deve lançar erro ao tentar autoavaliação', async () => {
      await expect(avaliacaoService.criarAvaliacao({ ...createData, avaliadorId: 'user1', avaliadoId: 'user1' }))
        .rejects.toThrow('Autoavaliação não é permitida.');
    });

    it('Deve lançar erro se a nota for menor que 1 ou maior que 5', async () => {
      await expect(avaliacaoService.criarAvaliacao({ ...createData, nota: 0 })).rejects.toThrow('A nota deve ser entre 1 e 5.');
      await expect(avaliacaoService.criarAvaliacao({ ...createData, nota: 6 })).rejects.toThrow('A nota deve ser entre 1 e 5.');
    });

    it('Deve lançar erro se a carona não existir', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(null);
      await expect(avaliacaoService.criarAvaliacao(createData)).rejects.toThrow('Carona não encontrada.');
    });

    it('Deve lançar erro se a carona não estiver FINALIZADA', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.AGENDADA });
      await expect(avaliacaoService.criarAvaliacao(createData)).rejects.toThrow('A carona precisa estar finalizada para ser avaliada.');
    });

    it('Deve lançar erro se não houver vínculo de reserva', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      reservaRepositoryMock.findByCaronaId.mockResolvedValueOnce([]); // Sem reservas
      await expect(avaliacaoService.criarAvaliacao(createData)).rejects.toThrow('Não existe vínculo válido de carona entre os usuários.');
    });

    it('Deve lançar erro se a avaliação já existir', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      reservaRepositoryMock.findByCaronaId.mockResolvedValueOnce([mockReserva as any]);
      avaliacaoRepositoryMock.findByCaronaAndUsers.mockResolvedValueOnce(mockAvaliacao);
      
      await expect(avaliacaoService.criarAvaliacao(createData)).rejects.toThrow('Esta avaliação já foi realizada.');
    });

    it('Deve criar avaliação e atualizar a média do usuário avaliado com sucesso', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      reservaRepositoryMock.findByCaronaId.mockResolvedValueOnce([mockReserva as any]);
      avaliacaoRepositoryMock.findByCaronaAndUsers.mockResolvedValueOnce(null);
      avaliacaoRepositoryMock.create.mockResolvedValueOnce(mockAvaliacao);
      
      // Simula avaliações anteriores para o cálculo da média
      avaliacaoRepositoryMock.findByAvaliadoId.mockResolvedValueOnce([mockAvaliacao]);

      const result = await avaliacaoService.criarAvaliacao(createData);

      expect(avaliacaoRepositoryMock.create).toHaveBeenCalledWith(createData);
      expect(usuarioRepositoryMock.update).toHaveBeenCalledWith({
        id: 'user2',
        mediaAvaliacao: 5,
        totalAvaliacoes: 1
      });
      expect(result).toEqual(mockAvaliacao);
    });
  });

  describe('findByAvaliadoId', () => {
    it('Deve retornar as avaliações do usuário', async () => {
      avaliacaoRepositoryMock.findByAvaliadoId.mockResolvedValueOnce([mockAvaliacao]);
      const result = await avaliacaoService.findByAvaliadoId('user2');
      expect(result).toEqual([mockAvaliacao]);
      expect(avaliacaoRepositoryMock.findByAvaliadoId).toHaveBeenCalledWith('user2');
    });
  });
});

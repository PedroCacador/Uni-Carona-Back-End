import { CaronaService, CreateCaronaDTO, UpdateCaronaDTO } from './CaronaService';
import { CaronaRepository } from '../repositories/CaronaRepository';
import { Carona, StatusCarona } from '../generated/prisma/client';
import { Decimal } from 'decimal.js';
import { IMapsService } from './MapsService';

describe('CaronaService', () => {
  let caronaService: CaronaService;
  let caronaRepositoryMock: jest.Mocked<CaronaRepository>;
  let mapsServiceMock: jest.Mocked<IMapsService>;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);

  const mockCarona: Carona = {
    id: '1',
    motoristaId: 'mot1',
    veiculoId: 'vei1',
    origem: 'Rua A',
    latitudeOrigem: -23.5505,
    longitudeOrigem: -46.6333,
    destino: 'Rua B',
    latitudeDestino: -23.5515,
    longitudeDestino: -46.6343,
    rotaPolyline: 'polyline_abc',
    distanciaMetros: 5000,
    duracaoSegundos: 600,
    dataHoraSaida: futureDate,
    assentosDisponiveis: 4,
    valorAjuda: new Decimal(10),
    status: StatusCarona.AGENDADA,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    caronaRepositoryMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByMotorista: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      updateAssentos: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<CaronaRepository>;

    mapsServiceMock = {
      getCoordinates: jest.fn(),
      getRoute: jest.fn(),
      searchPlaces: jest.fn(),
    };

    caronaService = new CaronaService(caronaRepositoryMock, mapsServiceMock);
  });

  describe('create', () => {
    const createDto: CreateCaronaDTO = {
      motoristaId: 'mot1',
      veiculoId: 'vei1',
      origem: 'Rua A',
      destino: 'Rua B',
      dataHoraSaida: futureDate,
      assentosDisponiveis: 4,
      valorAjuda: new Decimal(10),
    };

    it('Deve lançar erro se campos obrigatórios faltarem', async () => {
      const invalidDto = { ...createDto, origem: '' };
      await expect(caronaService.create(invalidDto)).rejects.toThrow('Campos obrigatórios:');
    });

    it('Deve lançar erro se os assentos disponíveis forem inválidos', async () => {
      await expect(caronaService.create({ ...createDto, assentosDisponiveis: 0 })).rejects.toThrow('Assentos disponíveis devem ser entre 1 e 8');
      await expect(caronaService.create({ ...createDto, assentosDisponiveis: 9 })).rejects.toThrow('Assentos disponíveis devem ser entre 1 e 8');
    });

    it('Deve lançar erro se o valor da ajuda for negativo', async () => {
      // @ts-ignore
      await expect(caronaService.create({ ...createDto, valorAjuda: -5 })).rejects.toThrow('Valor de ajuda não pode ser negativo');
    });

    it('Deve lançar erro se a data de saída for inválida', async () => {
      await expect(caronaService.create({ ...createDto, dataHoraSaida: new Date('invalid') })).rejects.toThrow('Data e hora inválidas');
    });

    it('Deve lançar erro se a data de saída for no passado', async () => {
      await expect(caronaService.create({ ...createDto, dataHoraSaida: pastDate })).rejects.toThrow('Data e hora devem ser futuras');
    });

    it('Deve criar uma carona com sucesso', async () => {
      mapsServiceMock.getCoordinates.mockResolvedValueOnce({ latitude: -23.5505, longitude: -46.6333, address: 'Rua A' });
      mapsServiceMock.getCoordinates.mockResolvedValueOnce({ latitude: -23.5515, longitude: -46.6343, address: 'Rua B' });
      mapsServiceMock.getRoute.mockResolvedValueOnce({ coordinates: [{ latitude: -23.5505, longitude: -46.6333 }], distanceMetros: 5000, duracaoSegundos: 600 });
      caronaRepositoryMock.create.mockResolvedValueOnce(mockCarona);

      const result = await caronaService.create(createDto);

      expect(mapsServiceMock.getCoordinates).toHaveBeenCalledTimes(2);
      expect(mapsServiceMock.getRoute).toHaveBeenCalled();
      expect(caronaRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
        ...createDto,
        latitudeOrigem: -23.5505,
        longitudeOrigem: -46.6333,
        latitudeDestino: -23.5515,
        longitudeDestino: -46.6343,
        rotaPolyline: JSON.stringify([{ latitude: -23.5505, longitude: -46.6333 }]),
        distanciaMetros: 5000,
        duracaoSegundos: 600
      }));
      expect(result).toEqual(mockCarona);
    });
  });

  describe('findAll', () => {
    it('Deve retornar todas as caronas com filtros aplicados', async () => {
      caronaRepositoryMock.findAll.mockResolvedValueOnce([mockCarona]);
      const result = await caronaService.findAll({ origem: 'Rua A' });
      expect(caronaRepositoryMock.findAll).toHaveBeenCalledWith({ origem: 'Rua A' });
      expect(result).toEqual([mockCarona]);
    });

    it('Deve repassar vagasDisponiveis ao repositório', async () => {
      caronaRepositoryMock.findAll.mockResolvedValueOnce([mockCarona]);
      await caronaService.findAll({
        origem: 'Campus',
        destino: 'Centro',
        vagasDisponiveis: 3,
      });
      expect(caronaRepositoryMock.findAll).toHaveBeenCalledWith({
        origem: 'Campus',
        destino: 'Centro',
        vagasDisponiveis: 3,
      });
    });

    it('Deve repassar intervalo de datas e apenasFuturas ao repositório', async () => {
      const min = new Date('2026-05-01T08:00:00.000Z');
      const max = new Date('2026-05-02T20:00:00.000Z');
      caronaRepositoryMock.findAll.mockResolvedValueOnce([]);
      await caronaService.findAll({
        dataHoraMin: min,
        dataHoraMax: max,
        apenasFuturas: true,
        status: StatusCarona.AGENDADA,
      });
      expect(caronaRepositoryMock.findAll).toHaveBeenCalledWith({
        dataHoraMin: min,
        dataHoraMax: max,
        apenasFuturas: true,
        status: StatusCarona.AGENDADA,
      });
    });

    it('Deve lançar erro se vagasDisponiveis for menor que 1', async () => {
      await expect(caronaService.findAll({ vagasDisponiveis: 0 })).rejects.toThrow(
        'vagasDisponiveis deve ser um inteiro entre 1 e 8.',
      );
      expect(caronaRepositoryMock.findAll).not.toHaveBeenCalled();
    });

    it('Deve lançar erro se vagasDisponiveis for maior que 8', async () => {
      await expect(caronaService.findAll({ vagasDisponiveis: 9 })).rejects.toThrow(
        'vagasDisponiveis deve ser um inteiro entre 1 e 8.',
      );
    });

    it('Deve lançar erro se vagasDisponiveis não for inteiro', async () => {
      await expect(caronaService.findAll({ vagasDisponiveis: 2.5 as unknown as number })).rejects.toThrow(
        'vagasDisponiveis deve ser um inteiro entre 1 e 8.',
      );
    });
  });

  describe('findAllActive', () => {
    it('Deve retornar caronas ativas (AGENDADAS)', async () => {
      caronaRepositoryMock.findAll.mockResolvedValueOnce([mockCarona]);
      const result = await caronaService.findAllActive();
      expect(caronaRepositoryMock.findAll).toHaveBeenCalledWith({ status: StatusCarona.AGENDADA });
      expect(result).toEqual([mockCarona]);
    });
  });

  describe('findById', () => {
    it('Deve lançar erro se o id for inválido', async () => {
      await expect(caronaService.findById('')).rejects.toThrow('ID inválido');
    });

    it('Deve lançar erro se a carona não for encontrada', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(null);
      await expect(caronaService.findById('1')).rejects.toThrow('Carona não encontrada');
    });

    it('Deve retornar a carona encontrada', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      const result = await caronaService.findById('1');
      expect(result).toEqual(mockCarona);
    });
  });

  describe('findByMotorista', () => {
    it('Deve lançar erro se o motoristaId for inválido', async () => {
      await expect(caronaService.findByMotorista('')).rejects.toThrow('ID do motorista inválido');
    });

    it('Deve retornar as caronas do motorista', async () => {
      caronaRepositoryMock.findByMotorista.mockResolvedValueOnce([mockCarona]);
      const result = await caronaService.findByMotorista('mot1');
      expect(caronaRepositoryMock.findByMotorista).toHaveBeenCalledWith('mot1');
      expect(result).toEqual([mockCarona]);
    });
  });

  describe('update', () => {
    const updateDto: UpdateCaronaDTO = {
      origem: 'Rua Nova',
    };

    it('Deve lançar erro se tentar editar carona que não está agendada', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.EM_ANDAMENTO });
      await expect(caronaService.update('1', updateDto)).rejects.toThrow('Só é possível editar caronas agendadas');
    });

    it('Deve lançar erro se assentos atualizados forem inválidos', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      await expect(caronaService.update('1', { assentosDisponiveis: 9 })).rejects.toThrow('Assentos disponíveis devem ser entre 1 e 8');
    });

    it('Deve lançar erro se data de atualização for inválida', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      await expect(caronaService.update('1', { dataHoraSaida: new Date('invalid') })).rejects.toThrow('Data e hora inválidas');
    });

    it('Deve lançar erro se data de atualização for no passado', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      await expect(caronaService.update('1', { dataHoraSaida: pastDate })).rejects.toThrow('Data e hora devem ser futuras');
    });

    it('Deve lançar erro se ocorrer erro no repositório ao atualizar', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      caronaRepositoryMock.update.mockResolvedValueOnce(null as any);
      await expect(caronaService.update('1', updateDto)).rejects.toThrow('Erro ao atualizar carona');
    });

    it('Deve atualizar a carona com sucesso', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      caronaRepositoryMock.update.mockResolvedValueOnce({ ...mockCarona, ...updateDto });
      const result = await caronaService.update('1', updateDto);
      expect(caronaRepositoryMock.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.origem).toEqual('Rua Nova');
    });
  });

  describe('updateStatus', () => {
    it('Deve lançar erro se carona já estiver finalizada', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.FINALIZADA });
      await expect(caronaService.updateStatus('1', StatusCarona.EM_ANDAMENTO)).rejects.toThrow('Não é possível alterar status de uma carona já finalizada');
    });

    it('Deve lançar erro se carona já estiver cancelada', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.CANCELADA });
      await expect(caronaService.updateStatus('1', StatusCarona.EM_ANDAMENTO)).rejects.toThrow('Não é possível alterar status de uma carona já cancelada');
    });

    it('Deve atualizar para CANCELADA corretamente', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      caronaRepositoryMock.updateStatus.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.CANCELADA });
      const result = await caronaService.updateStatus('1', StatusCarona.CANCELADA);
      expect(caronaRepositoryMock.updateStatus).toHaveBeenCalledWith('1', StatusCarona.CANCELADA);
      expect(result.status).toEqual(StatusCarona.CANCELADA);
    });

    it('Deve lançar erro se tentar INICIAR (EM_ANDAMENTO) uma carona que não está agendada', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.CANCELADA });
    });

    it('Deve lançar erro tentando iniciar se bater na regra especifica de não ser agendada', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.EM_ANDAMENTO });
      await expect(caronaService.updateStatus('1', StatusCarona.EM_ANDAMENTO)).rejects.toThrow('Apenas caronas agendadas podem iniciar');
    });

    it('Deve lançar erro se tentar FINALIZAR carona que não está em andamento', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona); // status: AGENDADA
      await expect(caronaService.updateStatus('1', StatusCarona.FINALIZADA)).rejects.toThrow('Apenas caronas em andamento podem ser finalizadas');
    });

    it('Deve atualizar status normalmente para EM_ANDAMENTO', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      caronaRepositoryMock.updateStatus.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.EM_ANDAMENTO });
      const result = await caronaService.updateStatus('1', StatusCarona.EM_ANDAMENTO);
      expect(result.status).toEqual(StatusCarona.EM_ANDAMENTO);
    });

    it('Deve atualizar status normalmente para FINALIZADA', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.EM_ANDAMENTO });
      caronaRepositoryMock.updateStatus.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.FINALIZADA });
      const result = await caronaService.updateStatus('1', StatusCarona.FINALIZADA);
      expect(result.status).toEqual(StatusCarona.FINALIZADA);
    });
  });

  describe('cancelRide', () => {
    it('Deve lançar erro se carona já estiver finalizada', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.FINALIZADA });
      await expect(caronaService.cancelRide('1')).rejects.toThrow('Não é possível cancelar uma carona já finalizada');
    });

    it('Deve lançar erro se carona já estiver cancelada', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.CANCELADA });
      await expect(caronaService.cancelRide('1')).rejects.toThrow('Carona já está cancelada');
    });

    it('Deve cancelar a carona', async () => {
      caronaRepositoryMock.findById.mockResolvedValueOnce(mockCarona);
      caronaRepositoryMock.updateStatus.mockResolvedValueOnce({ ...mockCarona, status: StatusCarona.CANCELADA });
      const result = await caronaService.cancelRide('1');
      expect(caronaRepositoryMock.updateStatus).toHaveBeenCalledWith('1', StatusCarona.CANCELADA);
      expect(result.status).toEqual(StatusCarona.CANCELADA);
    });
  });
});

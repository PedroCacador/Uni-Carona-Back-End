import { ReservaService } from "./ReservaService";
import { ReservaRepository } from "../repositories/ReservaRepository";
import { CaronaRepository } from "../repositories/CaronaRepository";
import { StatusReserva, StatusCarona } from "../generated/prisma/client";

describe("ReservaService", () => {
    let reservaService: ReservaService;
    let mockReservaRepository: jest.Mocked<ReservaRepository>;
    let mockCaronaRepository: jest.Mocked<CaronaRepository>;

    beforeEach(() => {
        mockReservaRepository = {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByCaronaId: jest.fn(),
            findByUsuarioId: jest.fn(),
            updateStatus: jest.fn(),
        } as unknown as jest.Mocked<ReservaRepository>;

        mockCaronaRepository = {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByMotoristaId: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            updateAssentos: jest.fn(),
        } as unknown as jest.Mocked<CaronaRepository>;

        reservaService = new ReservaService(mockReservaRepository, mockCaronaRepository);
    });

    describe("create", () => {
        it("deve criar uma reserva com sucesso", async () => {
            const caronaMock = {
                id: "carona-1",
                motoristaId: "motorista-1",
                assentosDisponiveis: 3,
            } as any;

            const reservaMock = {
                id: "reserva-1",
                caronaId: "carona-1",
                usuarioId: "passageiro-1",
                quantidadePessoas: 1,
                status: StatusReserva.PENDENTE,
            } as any;

            mockCaronaRepository.findById.mockResolvedValue(caronaMock);
            mockReservaRepository.create.mockResolvedValue(reservaMock);

            const data = {
                caronaId: "carona-1",
                usuarioId: "passageiro-1",
                quantidadePessoas: 1,
            };

            const result = await reservaService.create(data);

            expect(mockCaronaRepository.findById).toHaveBeenCalledWith("carona-1");
            expect(mockReservaRepository.create).toHaveBeenCalledWith({
                ...data,
                status: StatusReserva.PENDENTE,
            });
            expect(result).toEqual(reservaMock);
        });

        it("deve lançar erro se a carona não existir", async () => {
            mockCaronaRepository.findById.mockResolvedValue(null);

            const data = {
                caronaId: "carona-inexistente",
                usuarioId: "passageiro-1",
                quantidadePessoas: 1,
            };

            await expect(reservaService.create(data)).rejects.toThrow("Carona não existe");
        });

        it("deve lançar erro se o usuário tentar reservar a própria carona", async () => {
            const caronaMock = {
                id: "carona-1",
                motoristaId: "motorista-1",
                assentosDisponiveis: 3,
            } as any;

            mockCaronaRepository.findById.mockResolvedValue(caronaMock);

            const data = {
                caronaId: "carona-1",
                usuarioId: "motorista-1", // Mesmo ID do motorista
                quantidadePessoas: 1,
            };

            await expect(reservaService.create(data)).rejects.toThrow("Você não pode reservar sua própria carona");
        });

        it("deve lançar erro se não houver assentos suficientes", async () => {
            const caronaMock = {
                id: "carona-1",
                motoristaId: "motorista-1",
                assentosDisponiveis: 2,
            } as any;

            mockCaronaRepository.findById.mockResolvedValue(caronaMock);

            const data = {
                caronaId: "carona-1",
                usuarioId: "passageiro-1",
                quantidadePessoas: 3, // Mais do que o disponível
            };

            await expect(reservaService.create(data)).rejects.toThrow("Apenas 2 assentos disponíveis. Você tentou reservar 3");
        });
    });

    describe("updateStatus", () => {
        it("deve confirmar uma reserva e reduzir os assentos da carona", async () => {
            const reservaMock = {
                id: "reserva-1",
                caronaId: "carona-1",
                status: StatusReserva.PENDENTE,
                quantidadePessoas: 2,
            } as any;

            const caronaMock = {
                id: "carona-1",
                assentosDisponiveis: 4,
            } as any;

            mockReservaRepository.findById.mockResolvedValueOnce(reservaMock).mockResolvedValueOnce({
                ...reservaMock,
                status: StatusReserva.CONFIRMADA,
            });
            mockCaronaRepository.findById.mockResolvedValue(caronaMock);

            await reservaService.updateStatus("reserva-1", StatusReserva.CONFIRMADA);

            expect(mockReservaRepository.updateStatus).toHaveBeenCalledWith("reserva-1", StatusReserva.CONFIRMADA);
            expect(mockCaronaRepository.updateAssentos).toHaveBeenCalledWith("carona-1", -2);
        });

        it("deve lançar erro ao confirmar se não houver assentos suficientes", async () => {
            const reservaMock = {
                id: "reserva-1",
                caronaId: "carona-1",
                status: StatusReserva.PENDENTE,
                quantidadePessoas: 3,
            } as any;

            const caronaMock = {
                id: "carona-1",
                assentosDisponiveis: 2, // Menos que o necessário para confirmar
            } as any;

            mockReservaRepository.findById.mockResolvedValue(reservaMock);
            mockCaronaRepository.findById.mockResolvedValue(caronaMock);

            await expect(reservaService.updateStatus("reserva-1", StatusReserva.CONFIRMADA)).rejects.toThrow("Não há assentos disponíveis para confirmar esta reserva.");
        });

        it("deve cancelar uma reserva confirmada e devolver os assentos", async () => {
            const reservaMock = {
                id: "reserva-1",
                caronaId: "carona-1",
                status: StatusReserva.CONFIRMADA,
                quantidadePessoas: 2,
            } as any;

            const caronaMock = {
                id: "carona-1",
                assentosDisponiveis: 2,
            } as any;

            mockReservaRepository.findById.mockResolvedValueOnce(reservaMock).mockResolvedValueOnce({
                ...reservaMock,
                status: StatusReserva.CANCELADA,
            });
            mockCaronaRepository.findById.mockResolvedValue(caronaMock);

            await reservaService.updateStatus("reserva-1", StatusReserva.CANCELADA);

            expect(mockReservaRepository.updateStatus).toHaveBeenCalledWith("reserva-1", StatusReserva.CANCELADA);
            expect(mockCaronaRepository.updateAssentos).toHaveBeenCalledWith("carona-1", 2); // Devolve 2 assentos
        });

        it("deve lançar erro se tentar alterar uma reserva já cancelada", async () => {
            const reservaMock = {
                id: "reserva-1",
                caronaId: "carona-1",
                status: StatusReserva.CANCELADA,
            } as any;

            mockReservaRepository.findById.mockResolvedValue(reservaMock);
            mockCaronaRepository.findById.mockResolvedValue({ id: "carona-1" } as any);

            await expect(reservaService.updateStatus("reserva-1", StatusReserva.CONFIRMADA)).rejects.toThrow("Não é possível alterar uma reserva já cancelada");
        });
    });
});

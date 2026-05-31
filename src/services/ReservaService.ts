import { ReservaRepository } from "../repositories/ReservaRepository";
import { CaronaRepository } from "../repositories/CaronaRepository";
import { Reserva, StatusReserva } from "../generated/prisma/client";

export type CreateReservaDTO = Omit<Reserva, "id" | "createdAt" | "updatedAt">;

export class ReservaService {
    constructor(
        private reservaRepository: ReservaRepository,
        private caronaRepository: CaronaRepository
    ) { }

    async create(data: Omit<CreateReservaDTO, "status">): Promise<Reserva> {
        if (!data.caronaId || !data.usuarioId) {
            throw new Error(`Campos obrigatórios: caronaId e usuarioId`);
        }

        const carona = await this.caronaRepository.findById(data.caronaId);
        if (!carona) {
            throw new Error("Carona não existe");
        }

        if (carona.motoristaId === data.usuarioId) {
            throw new Error("Você não pode reservar sua própria carona");
        }

        if (data.quantidadePessoas > carona.assentosDisponiveis) {
            throw new Error(`Apenas ${carona.assentosDisponiveis} assentos disponíveis. Você tentou reservar ${data.quantidadePessoas}`);
        }

        return this.reservaRepository.create({
            ...data,
            status: StatusReserva.PENDENTE
        });
    }

    async findAll(): Promise<Reserva[]> {
        return this.reservaRepository.findAll();
    }

    async findById(id: string): Promise<Reserva> {
        const reserva = await this.reservaRepository.findById(id);
        if (!reserva) {
            throw new Error("Reserva não encontrada");
        }
        return reserva;
    }

    async findByCaronaId(caronaId: string): Promise<Reserva[]> {
        return this.reservaRepository.findByCaronaId(caronaId);
    }

    async findByUsuarioId(usuarioId: string): Promise<Reserva[]> {
        return this.reservaRepository.findByUsuarioId(usuarioId);
    }

    async updateStatus(id: string, novoStatus: StatusReserva): Promise<Reserva> {
        const reserva = await this.findById(id);
        const carona = await this.caronaRepository.findById(reserva.caronaId);
        if (!carona) {
            throw new Error("Carona associada não encontrada");
        }

        if (reserva.status === StatusReserva.CANCELADA) {
            throw new Error("Não é possível alterar uma reserva já cancelada");
        }

        if (novoStatus === StatusReserva.CONFIRMADA && reserva.status !== StatusReserva.CONFIRMADA) {
            if (reserva.quantidadePessoas > carona.assentosDisponiveis) {
                throw new Error("Não há assentos disponíveis para confirmar esta reserva.");
            }
            // Confirma a reserva e reduz os assentos
            await this.reservaRepository.updateStatus(id, StatusReserva.CONFIRMADA);
            await this.caronaRepository.updateAssentos(carona.id, -reserva.quantidadePessoas);
        } else if (novoStatus === StatusReserva.CANCELADA && reserva.status === StatusReserva.CONFIRMADA) {
            // Cancela a reserva e retorna os assentos
            await this.reservaRepository.updateStatus(id, StatusReserva.CANCELADA);
            await this.caronaRepository.updateAssentos(carona.id, reserva.quantidadePessoas);
        } else if (novoStatus === StatusReserva.CANCELADA && reserva.status === StatusReserva.PENDENTE) {
             // Apenas cancela
             await this.reservaRepository.updateStatus(id, StatusReserva.CANCELADA);
        } else {
             // Outras transições (ex. Pendente para Pendente só atualiza status se for sentido)
             await this.reservaRepository.updateStatus(id, novoStatus);
        }

        return this.reservaRepository.findById(id) as Promise<Reserva>;
    }

    async cancel(id: string): Promise<Reserva> {
        return this.updateStatus(id, StatusReserva.CANCELADA);
    }
}

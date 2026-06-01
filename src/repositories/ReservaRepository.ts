import { prisma } from "../database/db";
import { Reserva, StatusReserva } from "../generated/prisma/client";

export class ReservaRepository {

    async create(data: Omit<Reserva, "id" | "createdAt" | "updatedAt">): Promise<Reserva> {
        return prisma.reserva.create({
            data
        });
    }

    async findAll(): Promise<Reserva[]> {
        return prisma.reserva.findMany({
            include: { carona: true, passageiro: true }
        });
    }

    async findById(id: string): Promise<Reserva | null> {
        return prisma.reserva.findUnique({
            where: { id },
            include: { carona: true, passageiro: true }
        });
    }

    async findByCaronaId(caronaId: string): Promise<Reserva[]> {
        return prisma.reserva.findMany({
            where: { caronaId },
            include: { passageiro: true }
        });
    }

    async findByUsuarioId(usuarioId: string): Promise<Reserva[]> {
        return prisma.reserva.findMany({
            where: { usuarioId },
            include: { carona: { include: { motorista: true } } }
        });
    }

    async updateStatus(id: string, status: StatusReserva): Promise<Reserva> {
        return prisma.reserva.update({
            where: { id },
            data: { status }
        });
    }

    async delete(id: string): Promise<Reserva> {
        return prisma.reserva.delete({
            where: { id }
        });
    }
}
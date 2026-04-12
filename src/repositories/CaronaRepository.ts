import { prisma } from "../database/db";
import { Carona, StatusCarona } from "../generated/prisma/client";

export class CaronaRepository {

    async create(data: Omit<Carona, "id" | "createdAt" | "updatedAt" | "status">): Promise<Carona> {
        return prisma.carona.create({
            data: {
                ...data,
                status: StatusCarona.AGENDADA
            }
        });
    }

    async findAll(filters?: {
        origem?: string;
        destino?: string;
        status?: StatusCarona;
        motoristaId?: string;
    }): Promise<Carona[]> {
        return prisma.carona.findMany({
            where: filters ? {
                origem: filters.origem ? { contains: filters.origem, mode: 'insensitive' } : undefined,
                destino: filters.destino ? { contains: filters.destino, mode: 'insensitive' } : undefined,
                status: filters.status,
                motoristaId: filters.motoristaId
            } : undefined,
            orderBy: { dataHoraSaida: 'asc' },
            include: { motorista: true, veiculo: true }
        });
    }

    async findById(id: string): Promise<Carona | null> {
        return prisma.carona.findUnique({
            where: { id },
            include: { motorista: true, veiculo: true }
        });
    }

    async findByMotorista(motoristaId: string): Promise<Carona[]> {
        return prisma.carona.findMany({
            where: { motoristaId }
        });
    }

    async update(id: string, data: Partial<Omit<Carona, "id" | "createdAt" | "updatedAt">>): Promise<Carona> {
        return prisma.carona.update({
            where: { id },
            data
        });
    }

    async updateStatus(id: string, status: StatusCarona): Promise<Carona> {
        return prisma.carona.update({
            where: { id },
            data: { status }
        });
    }

    async updateAssentos(id: string, increment: number): Promise<Carona> {
        return prisma.carona.update({
            where: { id },
            data: {
                assentosDisponiveis: {
                    increment: increment
                }
            }
        });
    }

    async softDelete(id: string): Promise<boolean> {
        await prisma.carona.update({
            where: { id },
            data: { status: StatusCarona.CANCELADA }
        });
        return true;
    }
}
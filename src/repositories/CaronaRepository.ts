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
        apenasFuturas?: boolean;
        dataHoraMin?: Date;
        dataHoraMax?: Date;
        /** Caronas com pelo menos N vagas livres (assentosDisponiveis >= N) */
        vagasDisponiveis?: number;
    }): Promise<Carona[]> {
        const where: Record<string, unknown> = {};

        if (filters?.origem) {
            where.origem = { contains: filters.origem, mode: 'insensitive' };
        }
        if (filters?.destino) {
            where.destino = { contains: filters.destino, mode: 'insensitive' };
        }
        if (filters?.status !== undefined) {
            where.status = filters.status;
        }
        if (filters?.motoristaId) {
            where.motoristaId = filters.motoristaId;
        }
        if (filters?.vagasDisponiveis !== undefined && filters.vagasDisponiveis > 0) {
            where.assentosDisponiveis = { gte: filters.vagasDisponiveis };
        }

        const dateAnd: Record<string, unknown>[] = [];
        if (filters?.apenasFuturas) {
            dateAnd.push({ dataHoraSaida: { gt: new Date() } });
        }
        if (filters?.dataHoraMin) {
            dateAnd.push({ dataHoraSaida: { gte: filters.dataHoraMin } });
        }
        if (filters?.dataHoraMax) {
            dateAnd.push({ dataHoraSaida: { lte: filters.dataHoraMax } });
        }
        if (dateAnd.length > 0) {
            where.AND = dateAnd;
        }

        const hasWhere = Object.keys(where).length > 0;

        return prisma.carona.findMany({
            where: hasWhere ? (where as object) : undefined,
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
import { BaseRepository } from "./BaseRepository";
import { Veiculo } from "../generated/prisma/client";
import { prisma } from "../database/db";
import { CreateVeiculoDTO, IVeiculoRepository, UpdateVeiculoDTO } from "./IVeiculoRepository";

export class VeiculoRepository extends BaseRepository<Veiculo, CreateVeiculoDTO, UpdateVeiculoDTO> implements IVeiculoRepository {
    constructor() {
        super(prisma.veiculo);
    }

    async findByPlaca(placa: string): Promise<Veiculo | null> {
        return this.model.findUnique({
            where: { placa }
        });
    }

    async findByProprietario(proprietarioId: string): Promise<Veiculo[]> {
        return this.model.findMany({
            where: { proprietarioId }
        });
    }
}

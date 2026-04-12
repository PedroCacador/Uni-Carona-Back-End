/**
 * Classe base genérica para repositórios usando Prisma.
 * 
 * Entity  -> Tipo da entidade retornada (ex: User, Product)
 * Create  -> Tipo dos dados necessários para criação
 * Update  -> Tipo dos dados permitidos para atualização
 */

export class BaseRepository<
    Entity,
    Create,
    Update> {
    constructor(protected model: any) { }

    async findAll(params?: any): Promise<Entity[]> {
        return this.model.findMany(params);
    }

    async findById(id: string, include?: any): Promise<Entity | null> {
        return this.model.findUnique({
            where: { id },
            include
        });
    }

    async create(data: Create): Promise<Entity> {
        return this.model.create({ data });
    }

    async update(id: string, data: Update): Promise<Entity> {
        return this.model.update({
            where: { id },
            data
        });
    }

    async delete(id: string): Promise<Entity> {
        return this.model.delete({
            where: { id }
        });
    }

    async deleteWhere(where: any): Promise<Entity> {
        return this.model.delete({ where });
    }
}
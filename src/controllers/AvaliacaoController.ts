import { Request, Response } from 'express';
import { AvaliacaoService } from '../services/AvaliacaoService';
import { Avaliacao, Usuario } from '../generated/prisma/client';

type AvaliacaoComRelacoes = Avaliacao & { avaliador?: Usuario | null; carona?: any };

export class AvaliacaoController {
  constructor(private readonly avaliacaoService: AvaliacaoService) { }

  private sanitizeUsuario(u: Usuario): Omit<Usuario, 'senha'> {
    const { senha: _s, ...safe } = u;
    return safe;
  }

  private sanitize(avaliacao: AvaliacaoComRelacoes): any {
    const { avaliador, ...rest } = avaliacao;
    return {
      ...rest,
      ...(avaliador ? { avaliador: this.sanitizeUsuario(avaliador) } : {})
    };
  }

  async findByUsuarioId(req: Request<{ usuarioId: string }>, res: Response) {
    try {
      const { usuarioId } = req.params;
      const avaliacoes = await this.avaliacaoService.findByUsuarioId(usuarioId);
      const safeAvaliacoes = avaliacoes.map(a => this.sanitize(a as AvaliacaoComRelacoes));
      res.json(safeAvaliacoes);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

import { Request, Response } from 'express';
import { UsuarioService } from '../services/UsuarioService';
import { Usuario } from '../models/Usuario';

export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) { }

  private sanitize(usuario: Usuario): Omit<Usuario, 'senhaHash'> {
    const { senhaHash, ...safeUsuario } = usuario;
    return safeUsuario;
  }

  async create(req: Request, res: Response) {
    try {
      const usuario = await this.usuarioService.create(req.body);
      res.status(201).json(this.sanitize(usuario));
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const usuarios = await this.usuarioService.findAllActive();
      const safeUsuarios = usuarios.map(u => this.sanitize(u));
      res.json(safeUsuarios);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async findById(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const usuario = await this.usuarioService.findById(id);
      res.json(this.sanitize(usuario));
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async update(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const usuario = await this.usuarioService.update(id, req.body);
      res.json(this.sanitize(usuario));
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      await this.usuarioService.softDelete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

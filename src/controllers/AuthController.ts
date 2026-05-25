import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { assertStringField } from '../utils/PayloadValidator';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;
      const result = await this.authService.login({ email, senha });
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  async esqueciSenha(req: Request, res: Response) {
    try {
      const email = assertStringField(req.body?.email, 'E-mail');
      const result = await this.authService.esqueciSenha({ email });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async redefinirSenha(req: Request, res: Response) {
    try {
      const token = assertStringField(req.body?.token, 'Token');
      const novaSenha = assertStringField(req.body?.novaSenha, 'Nova senha');
      const result = await this.authService.redefinirSenha({ token, novaSenha });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

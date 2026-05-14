import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

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
}

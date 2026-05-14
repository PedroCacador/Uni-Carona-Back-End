import { Request, Response, NextFunction } from 'express';

export function roleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.userRole;

    if (!userRole) {
      return res.status(403).json({ message: 'Acesso negado. Role não identificada.' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para acessar este recurso.' });
    }

    return next();
  };
}

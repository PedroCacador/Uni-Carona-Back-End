import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.routes';
import { usuarioRoutes } from './routes/usuario.routes';
import { caronaRoutes } from './routes/carona.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/usuarios', usuarioRoutes);
app.use('/caronas', caronaRoutes);

export { app };
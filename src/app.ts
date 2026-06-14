import express from 'express';
import cors from 'cors';
import { configDotenv } from 'dotenv';
configDotenv();
import router from './routes/router.routes';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from './swagger.json';

const app = express();

app.use(cors());
app.use(express.json());

// Rota de documentação do Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/", router);

export { app };
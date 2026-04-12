import express from 'express';
import cors from 'cors';
import { configDotenv } from 'dotenv';
configDotenv();
import router from './routes/router.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", router);

export { app };
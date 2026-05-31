import 'dotenv/config';
import { app } from './app';
import { validateEnvOnStartup } from './config/env';

validateEnvOnStartup();

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});

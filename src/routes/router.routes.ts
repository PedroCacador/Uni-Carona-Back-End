import { Router } from "express"

import { usuarioRoutes } from "./usuario.routes";
import { caronaRoutes } from "./carona.routes";
import { reservaRoutes } from "./reserva.routes";
import { healthRouter } from "./health.routes";
import { veiculoRoutes } from "./veiculo.routes";

const router = Router();

router.use("/usuarios", usuarioRoutes);
router.use("/carona", caronaRoutes);
router.use("/reservas", reservaRoutes);
router.use("/health", healthRouter);
router.use("/veiculos", veiculoRoutes);

export default router;
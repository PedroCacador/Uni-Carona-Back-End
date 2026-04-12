import { Router } from "express"

import { usuarioRoutes } from "./usuario.routes";
import { caronaRoutes } from "./carona.routes";
import { reservaRoutes } from "./reserva.routes";
import { healthRouter } from "./health.routes";

const router = Router();

router.use("/usuarios", usuarioRoutes);
router.use("/carona", caronaRoutes);
router.use("/reservas", reservaRoutes);
router.use("/health", healthRouter);

export default router;
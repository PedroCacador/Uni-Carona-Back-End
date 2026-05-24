import { Router } from "express"

import { usuarioRoutes } from "./usuario.routes";
import { caronaRoutes } from "./carona.routes";
import { reservaRoutes } from "./reserva.routes";
import { healthRouter } from "./health.routes";
import { veiculoRoutes } from "./veiculo.routes";
import { authRoutes } from "./auth.routes";
import { mapsRoutes } from "./maps.routes";
import { avaliacaoRoutes } from "./avaliacao.routes";
import { mapsRoutes } from "./maps.routes";

const router = Router();

router.use("/usuarios", usuarioRoutes);
router.use("/carona", caronaRoutes);
router.use("/reservas", reservaRoutes);
router.use("/health", healthRouter);
router.use("/veiculos", veiculoRoutes);
router.use("/auth", authRoutes);
router.use("/maps", mapsRoutes);
router.use("/avaliacoes", avaliacaoRoutes);
router.use("/maps", mapsRoutes);

export default router;
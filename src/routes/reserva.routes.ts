import { Router } from "express";
import { ReservaController } from "../controllers/ReservaController";
import { ReservaService } from "../services/ReservaService";
import { ReservaRepository } from "../repositories/ReservaRepository";
import { CaronaRepository } from "../repositories/CaronaRepository";

const reservaRoutes = Router();

// Injeção de Dependências
const reservaRepository = new ReservaRepository();
const caronaRepository = new CaronaRepository();
const reservaService = new ReservaService(reservaRepository, caronaRepository);
const controller = new ReservaController(reservaService);

reservaRoutes.post("/", controller.create.bind(controller));
reservaRoutes.get("/", controller.findAll.bind(controller));
reservaRoutes.get("/:id", controller.findById.bind(controller));
reservaRoutes.get("/carona/:caronaId", controller.findByCaronaId.bind(controller));
reservaRoutes.get("/usuario/:usuarioId", controller.findByUsuarioId.bind(controller));
reservaRoutes.patch("/:id/status", controller.updateStatus.bind(controller));
reservaRoutes.delete("/:id", controller.cancel.bind(controller));

export { reservaRoutes };
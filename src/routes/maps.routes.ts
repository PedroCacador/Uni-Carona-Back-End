import { Router } from "express";
import { MapsController } from "../controllers/MapsController";

const mapsRoutes = Router();
const mapsController = new MapsController();

mapsRoutes.get("/search", mapsController.searchPlaces);
mapsRoutes.get("/route", mapsController.getRoute);
mapsRoutes.get("/geocode", mapsController.geocode);

export { mapsRoutes };

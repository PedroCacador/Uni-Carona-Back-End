import { Router } from 'express';
import { MapsController } from '../controllers/MapsController';

const mapsRoutes = Router();
const mapsController = new MapsController();

mapsRoutes.get('/search', mapsController.search);
mapsRoutes.get('/geocode', mapsController.geocode);
mapsRoutes.get('/route', mapsController.getRoute);

export { mapsRoutes };

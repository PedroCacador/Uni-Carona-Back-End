import { Request, Response } from 'express';
import { OpenMapsService } from '../services/MapsService';

const mapsService = new OpenMapsService();

export class MapsController {
  async search(req: Request, res: Response) {
    try {
      const { q, lat, lng } = req.query;
      if (!q) {
        return res.status(400).json({ message: 'Termo de busca é obrigatório' });
      }

      const result = await mapsService.searchPlaces(
        q as string,
        lat ? parseFloat(lat as string) : undefined,
        lng ? parseFloat(lng as string) : undefined
      );
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async geocode(req: Request, res: Response) {
    try {
      const { address } = req.query;
      if (!address) {
        return res.status(400).json({ message: 'Endereço é obrigatório' });
      }

      const result = await mapsService.getCoordinates(address as string);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getRoute(req: Request, res: Response) {
    try {
      const { originLat, originLng, destLat, destLng } = req.query;

      if (!originLat || !originLng || !destLat || !destLng) {
        return res.status(400).json({ message: 'Coordenadas de origem e destino são obrigatórias' });
      }

      const result = await mapsService.getRoute(
        { lat: parseFloat(originLat as string), lng: parseFloat(originLng as string) },
        { lat: parseFloat(destLat as string), lng: parseFloat(destLng as string) }
      );

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}

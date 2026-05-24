import { Request, Response } from "express";
import { OpenMapsService } from "../services/MapsService";

export class MapsController {
  async searchPlaces(req: Request, res: Response) {
    try {
      let { q, lat, lon } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query string (q) é obrigatória." });
      }

      const parsedLat = lat ? parseFloat(lat as string) : undefined;
      const parsedLon = lon ? parseFloat(lon as string) : undefined;

      const mapsService = new OpenMapsService();
      const results = await mapsService.searchPlaces(q, parsedLat, parsedLon);

      return res.json(results);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: error.message || "Erro ao buscar locais." });
    }
  }

  async getRoute(req: Request, res: Response) {
    try {
      const { originLat, originLng, destLat, destLng } = req.query;

      if (!originLat || !originLng || !destLat || !destLng) {
        return res.status(400).json({ message: "Coordenadas de origem e destino são obrigatórias." });
      }

      const start = `${originLng},${originLat}`;
      const end = `${destLng},${destLat}`;
      const url = `http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Erro na API do OSRM");
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        return res.status(404).json({ message: "Nenhuma rota encontrada." });
      }

      const route = data.routes[0];

      const coordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0]
      }));

      const result = {
        coordinates,
        distanceMetros: route.distance,
        duracaoSegundos: route.duration
      };

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao calcular a rota." });
    }
  }

  async geocode(req: Request, res: Response) {
    try {
      const { address } = req.query;

      if (!address || typeof address !== 'string') {
        return res.status(400).json({ message: "Endereço é obrigatório." });
      }

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "UniCarona/1.0",
          "Accept-Language": "pt-BR"
        }
      });

      if (!response.ok) {
        throw new Error("Erro na API do Nominatim");
      }

      const data = await response.json();

      if (data.length === 0) {
        return res.status(404).json({ message: "Endereço não encontrado." });
      }

      const result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        address: data[0].display_name
      };

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao buscar endereço." });
    }
  }
}

import { Request, Response } from "express";

export class MapsController {
  async searchPlaces(req: Request, res: Response) {
    try {
      let { q, lat, lon } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query string (q) é obrigatória." });
      }

      let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=20`;

      if (lat && lon) {
        const offset = 0.5;
        const minLon = parseFloat(lon as string) - offset;
        const minLat = parseFloat(lat as string) - offset;
        const maxLon = parseFloat(lon as string) + offset;
        const maxLat = parseFloat(lat as string) + offset;

        // location_bias_scale=0.8 ajuda a dar mais peso para a distância do que para a "importância" do lugar
        url += `&lat=${lat}&lon=${lon}&bbox=${minLon},${minLat},${maxLon},${maxLat}&location_bias_scale=0.8`;
      }

      const response = await fetch(url, {
        headers: {
          "Accept-Language": "pt-BR"
        }
      });

      if (!response.ok) {
        throw new Error("Erro na API do Photon");
      }

      const data = await response.json();

      // Filtramos fora coisas como cidades inteiras, estados ou fronteiras
      const filteredFeatures = data.features.filter((feature: any) => {
        const { osm_key, osm_value } = feature.properties;
        if (osm_key === 'boundary') return false;
        if (osm_key === 'place' && ['city', 'state', 'country', 'region', 'county', 'municipality', 'town', 'village'].includes(osm_value)) {
          return false;
        }
        return true;
      });

      const results = filteredFeatures.slice(0, 5).map((feature: any) => {
        const { geometry, properties } = feature;

        // Monta um endereço mais legível
        let addressParts = [];
        if (properties.name) addressParts.push(properties.name);
        if (properties.street) addressParts.push(properties.street);
        if (properties.district) addressParts.push(properties.district);
        if (properties.city) addressParts.push(properties.city);

        return {
          latitude: geometry.coordinates[1],
          longitude: geometry.coordinates[0],
          address: addressParts.join(', ') || "Endereço desconhecido"
        };
      });

      return res.json(results);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao buscar locais." });
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

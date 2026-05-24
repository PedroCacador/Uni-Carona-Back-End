import axios from 'axios';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
}

export interface RouteResult {
  coordinates: { latitude: number; longitude: number }[];
  distanceMetros: number;
  duracaoSegundos: number;
}

export interface IMapsService {
  getCoordinates(address: string): Promise<GeocodingResult>;
  getRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<RouteResult>;
  searchPlaces(query: string, lat?: number, lon?: number): Promise<GeocodingResult[]>;
}

export class OpenMapsService implements IMapsService {
  async searchPlaces(query: string, lat?: number, lon?: number): Promise<GeocodingResult[]> {
    try {
      const response = await axios.get('http://photon.komoot.io/api', {
        params: {
          q: query,
          limit: 10,
          lat: lat,
          lon: lon
        },
        headers: {
          'User-Agent': 'UniCaronaApp-Thiago-Dev',
          'Accept': 'application/json'
        }
      });

      if (!response.data || !response.data.features) {
        return [];
      }

      return response.data.features.map((item: any) => {
        const { coordinates } = item.geometry;
        const { name, street, city, state, country } = item.properties;
        const address = [name, street, city, state].filter(Boolean).join(', ');

        return {
          latitude: coordinates[1],
          longitude: coordinates[0],
          address: address || 'Endereço sem nome'
        };
      });
    } catch (error: any) {
      console.error('Erro no Photon Search:', error.message);
      throw new Error('Falha ao buscar endereços no Photon');
    }
  }

  async getCoordinates(address: string): Promise<GeocodingResult> {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'UniCaronaApp-Thiago-Dev'
        }
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('Endereço não encontrado');
      }

      const { lat, lon, display_name } = response.data[0];
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        address: display_name
      };
    } catch (error: any) {
      console.error('Erro no Geocode Nominatim:', error.response?.data || error.message);
      throw new Error('Falha ao obter coordenadas do endereço no OpenStreetMap');
    }
  }

  async getRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<RouteResult> {
    try {
      const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      const response = await axios.get(`http://router.project-osrm.org/route/v1/driving/${coordinates}`, {
        params: {
          overview: 'full',
          geometries: 'geojson'
        }
      });

      if (!response.data || !response.data.routes || response.data.routes.length === 0) {
        throw new Error('Rota não encontrada');
      }

      const route = response.data.routes[0];
      const coords = route.geometry.coordinates.map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0]
      }));

      return {
        coordinates: coords,
        distanceMetros: Math.round(route.distance),
        duracaoSegundos: Math.round(route.duration)
      };
    } catch (error: any) {
      throw new Error('Falha ao calcular rota');
    }
  }
}

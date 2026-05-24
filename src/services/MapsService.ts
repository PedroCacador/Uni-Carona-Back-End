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
      const params: any = {
        q: query,
        limit: 20
      };

      if (lat !== undefined && lon !== undefined) {
        const offset = 0.5;
        const minLon = lon - offset;
        const minLat = lat - offset;
        const maxLon = lon + offset;
        const maxLat = lat + offset;

        params.lat = lat;
        params.lon = lon;
        params.bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
        params.location_bias_scale = 0.8;
      }

      const response = await axios.get('https://photon.komoot.io/api/', {
        params,
        headers: {
          'User-Agent': 'UniCaronaApp-Thiago-Dev',
          'Accept-Language': 'pt-BR'
        }
      });

      if (!response.data || !response.data.features) {
        return [];
      }

      const filteredFeatures = response.data.features.filter((feature: any) => {
        const { osm_key, osm_value } = feature.properties;
        if (osm_key === 'boundary') return false;
        if (osm_key === 'place' && ['city', 'state', 'country', 'region', 'county', 'municipality', 'town', 'village'].includes(osm_value)) {
          return false;
        }
        return true;
      });

      return filteredFeatures.slice(0, 5).map((feature: any) => {
        const { geometry, properties } = feature;

        let addressParts = [];
        if (properties.name) addressParts.push(properties.name);
        if (properties.street) addressParts.push(properties.street);
        if (properties.district) addressParts.push(properties.district);
        if (properties.city) addressParts.push(properties.city);

        return {
          latitude: geometry.coordinates[1],
          longitude: geometry.coordinates[0],
          address: addressParts.join(', ') || 'Endereço desconhecido'
        };
      });
    } catch (error: any) {
      console.error('Erro no Photon Search:', error.message);
      throw new Error('Falha ao buscar locais.');
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

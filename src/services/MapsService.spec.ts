import { OpenMapsService } from "./MapsService";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("OpenMapsService", () => {
    let mapsService: OpenMapsService;

    beforeEach(() => {
        mapsService = new OpenMapsService();
        jest.clearAllMocks();
    });

    describe("searchPlaces", () => {
        it("deve buscar locais com sucesso no Photon", async () => {
            const mockResponse = {
                data: {
                    features: [
                        {
                            properties: {
                                osm_key: "amenity",
                                osm_value: "university",
                                name: "Universidade Teste",
                                street: "Rua Teste",
                                city: "Cidade Teste"
                            },
                            geometry: {
                                coordinates: [-46.633308, -23.55052] // lon, lat
                            }
                        }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const result = await mapsService.searchPlaces("Universidade");

            expect(mockedAxios.get).toHaveBeenCalledWith('http://photon.komoot.io/api', expect.any(Object));
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                latitude: -23.55052,
                longitude: -46.633308,
                address: "Universidade Teste, Rua Teste, Cidade Teste"
            });
        });

        it("deve retornar array vazio se falhar ou não encontrar nada", async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: {} });

            const result = await mapsService.searchPlaces("Desconhecido");
            expect(result).toEqual([]);
        });
    });

    describe("getCoordinates", () => {
        it("deve obter coordenadas a partir do endereço no Nominatim", async () => {
            const mockResponse = {
                data: [
                    {
                        lat: "-23.550520",
                        lon: "-46.633308",
                        display_name: "Praça da Sé, São Paulo"
                    }
                ]
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const result = await mapsService.getCoordinates("Praça da Sé, São Paulo");

            expect(mockedAxios.get).toHaveBeenCalledWith('https://nominatim.openstreetmap.org/search', expect.any(Object));
            expect(result).toEqual({
                latitude: -23.550520,
                longitude: -46.633308,
                address: "Praça da Sé, São Paulo"
            });
        });

        it("deve lançar erro se endereço não for encontrado", async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: [] });

            await expect(mapsService.getCoordinates("Endereço Inexistente")).rejects.toThrow("Falha ao obter coordenadas do endereço no OpenStreetMap");
        });
    });

    describe("getRoute", () => {
        it("deve calcular a rota com sucesso usando OSRM", async () => {
            const mockResponse = {
                data: {
                    routes: [
                        {
                            distance: 1500.5,
                            duration: 300.2,
                            geometry: {
                                coordinates: [
                                    [-46.633308, -23.550520], // lon, lat
                                    [-46.634000, -23.551000]
                                ]
                            }
                        }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const origin = { lat: -23.550520, lng: -46.633308 };
            const destination = { lat: -23.551000, lng: -46.634000 };

            const result = await mapsService.getRoute(origin, destination);

            expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('http://router.project-osrm.org/route/v1/driving/'), expect.any(Object));
            expect(result).toEqual({
                distanceMetros: 1501,
                duracaoSegundos: 300,
                coordinates: [
                    { latitude: -23.550520, longitude: -46.633308 },
                    { latitude: -23.551000, longitude: -46.634000 }
                ]
            });
        });

        it("deve lançar erro se rota não for encontrada", async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: { routes: [] } });

            const origin = { lat: -23.550520, lng: -46.633308 };
            const destination = { lat: -23.551000, lng: -46.634000 };

            await expect(mapsService.getRoute(origin, destination)).rejects.toThrow("Falha ao calcular rota");
        });
    });
});

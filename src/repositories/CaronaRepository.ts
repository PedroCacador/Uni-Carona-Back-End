import { Carona, CreateCaronaDTO, UpdateCaronaDTO, StatusCarona } from '../models/Carona';
import { randomUUID } from 'crypto';

// Simulando banco de dados (substitua pelo seu banco real)
let caronas: Carona[] = [];

export class CaronaRepository {
  
  async create(data: CreateCaronaDTO): Promise<Carona> {
    const now = new Date();
    const newCarona: Carona = {
      id: randomUUID(),
      ...data,
      dataHoraSaida: new Date(data.dataHoraSaida),
      status: StatusCarona.AGENDADA,
      createdAt: now,
      updatedAt: now
    };
    
    caronas.push(newCarona);
    
    // TODO: INSERT INTO carona SET ?
    return newCarona;
  }

  async findAll(filters?: { 
    origem?: string; 
    destino?: string; 
    status?: StatusCarona;
    motoristaId?: string;
  }): Promise<Carona[]> {
    let filteredCaronas = [...caronas];
    
    if (filters) {
      if (filters.origem) {
        filteredCaronas = filteredCaronas.filter(c => 
          c.origem.toLowerCase().includes(filters.origem!.toLowerCase())
        );
      }
      if (filters.destino) {
        filteredCaronas = filteredCaronas.filter(c => 
          c.destino.toLowerCase().includes(filters.destino!.toLowerCase())
        );
      }
      if (filters.status) {
        filteredCaronas = filteredCaronas.filter(c => c.status === filters.status);
      }
      if (filters.motoristaId) {
        filteredCaronas = filteredCaronas.filter(c => c.motoristaId === filters.motoristaId);
      }
    }
    
    // Ordenar por dataHoraSaida (mais próximas primeiro)
    filteredCaronas.sort((a, b) => a.dataHoraSaida.getTime() - b.dataHoraSaida.getTime());
    
    return filteredCaronas;
  }

  async findById(id: string): Promise<Carona | null> {
    const carona = caronas.find(c => c.id === id);
    return carona || null;
  }

  async findByMotorista(motoristaId: string): Promise<Carona[]> {
    const caronasMotorista = caronas.filter(c => c.motoristaId === motoristaId);
    return caronasMotorista;
  }

  async update(id: string, data: UpdateCaronaDTO): Promise<Carona | null> {
    const index = caronas.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    caronas[index] = {
      ...caronas[index],
      ...data,
      dataHoraSaida: data.dataHoraSaida ? new Date(data.dataHoraSaida) : caronas[index].dataHoraSaida,
      updatedAt: new Date()
    };
    
    return caronas[index];
  }

  async updateStatus(id: string, status: StatusCarona): Promise<Carona | null> {
    const index = caronas.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    caronas[index].status = status;
    caronas[index].updatedAt = new Date();
    
    return caronas[index];
  }

  async softDelete(id: string): Promise<boolean> {
    const index = caronas.findIndex(c => c.id === id);
    
    if (index === -1) return false;
    
    caronas[index].status = StatusCarona.CANCELADA;
    caronas[index].updatedAt = new Date();
    
    return true;
  }
}
import { UsuarioService, CreateUsuarioDTO, UpdateUsuarioDTO } from './UsuarioService';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';
import { Usuario } from '../generated/prisma/client';

describe('UsuarioService', () => {
  let usuarioService: UsuarioService;
  let usuarioRepositoryMock: jest.Mocked<IUsuarioRepository>;

  const mockDate = new Date('2000-01-01T00:00:00.000Z');

  const mockUsuario: Usuario = {
    id: '1',
    nome: 'João da Silva',
    email: 'joao@teste.com',
    cpf: '12345678900',
    whatsapp: '11999999999',
    curso: 'Engenharia',
    senha: 'hash_senha123',
    dataNascimento: mockDate,
    status: 'ATIVO',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    usuarioRepositoryMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
    };
    usuarioService = new UsuarioService(usuarioRepositoryMock);
  });

  describe('create', () => {
    const createDto: CreateUsuarioDTO = {
      nome: 'João da Silva',
      email: 'joao@teste.com',
      cpf: '12345678900',
      whatsapp: '11999999999',
      curso: 'Engenharia',
      senha: 'senha123',
      dataNascimento: mockDate,
    };

    it('Deve lançar um erro se o nome for vazio', async () => {
      await expect(usuarioService.create({ ...createDto, nome: '' })).rejects.toThrow('Nome não pode ser vazio.');
      await expect(usuarioService.create({ ...createDto, nome: '   ' })).rejects.toThrow('Nome não pode ser vazio.');
    });

    it('Deve lançar um erro se o email for vazio', async () => {
      await expect(usuarioService.create({ ...createDto, email: '' })).rejects.toThrow('E-mail não pode ser vazio.');
      await expect(usuarioService.create({ ...createDto, email: '   ' })).rejects.toThrow('E-mail não pode ser vazio.');
    });

    it('Deve lançar um erro se o email já estiver em uso', async () => {
      usuarioRepositoryMock.findByEmail.mockResolvedValueOnce(mockUsuario);
      await expect(usuarioService.create(createDto)).rejects.toThrow('E-mail já está em uso.');
      expect(usuarioRepositoryMock.findByEmail).toHaveBeenCalledWith(createDto.email);
    });

    it('Deve criar um usuário com sucesso', async () => {
      usuarioRepositoryMock.findByEmail.mockResolvedValueOnce(null);
      usuarioRepositoryMock.create.mockResolvedValueOnce(mockUsuario);

      const result = await usuarioService.create(createDto);

      expect(usuarioRepositoryMock.findByEmail).toHaveBeenCalledWith(createDto.email);
      expect(usuarioRepositoryMock.create).toHaveBeenCalledWith({
        ...createDto,
        senha: expect.any(String),
        status: 'ATIVO',
        role: 'USER',
      });
      expect(result).toEqual(mockUsuario);
    });
  });

  describe('findAll', () => {
    it('Deve retornar todos os usuários', async () => {
      usuarioRepositoryMock.findAll.mockResolvedValueOnce([mockUsuario]);
      const result = await usuarioService.findAll();
      expect(usuarioRepositoryMock.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockUsuario]);
    });
  });

  describe('findAllActive', () => {
    it('Deve retornar todos os usuários ativos', async () => {
      usuarioRepositoryMock.findAllActive.mockResolvedValueOnce([mockUsuario]);
      const result = await usuarioService.findAllActive();
      expect(usuarioRepositoryMock.findAllActive).toHaveBeenCalled();
      expect(result).toEqual([mockUsuario]);
    });
  });

  describe('findById', () => {
    it('Deve lançar um erro se o usuário não for encontrado', async () => {
      usuarioRepositoryMock.findById.mockResolvedValueOnce(null);
      await expect(usuarioService.findById('1')).rejects.toThrow('Usuário não encontrado ou inativo.');
    });

    it('Deve lançar um erro se o usuário estiver inativo', async () => {
      usuarioRepositoryMock.findById.mockResolvedValueOnce({ ...mockUsuario, status: 'INATIVO' });
      await expect(usuarioService.findById('1')).rejects.toThrow('Usuário não encontrado ou inativo.');
    });

    it('Deve retornar o usuário se for encontrado e ativo', async () => {
      usuarioRepositoryMock.findById.mockResolvedValueOnce(mockUsuario);
      const result = await usuarioService.findById('1');
      expect(result).toEqual(mockUsuario);
    });
  });

  describe('update', () => {
    const updateDto: UpdateUsuarioDTO = {
      nome: 'Nome Atualizado',
      senha: 'nova_senha',
    };

    it('Deve atualizar um usuário com sucesso', async () => {
      usuarioRepositoryMock.findById.mockResolvedValueOnce(mockUsuario);
      usuarioRepositoryMock.update.mockResolvedValueOnce({ ...mockUsuario, nome: updateDto.nome! });

      const result = await usuarioService.update('1', updateDto);

      expect(usuarioRepositoryMock.findById).toHaveBeenCalledWith('1');
      expect(usuarioRepositoryMock.update).toHaveBeenCalledWith({
        id: '1',
        nome: updateDto.nome,
        senha: expect.any(String),
      });
      expect(result.nome).toBe(updateDto.nome);
    });
  });

  describe('softDelete', () => {
    it('Deve definir o status do usuário como INATIVO', async () => {
      usuarioRepositoryMock.findById.mockResolvedValueOnce(mockUsuario);
      usuarioRepositoryMock.update.mockResolvedValueOnce({ ...mockUsuario, status: 'INATIVO' });

      await usuarioService.softDelete('1');

      expect(usuarioRepositoryMock.findById).toHaveBeenCalledWith('1');
      expect(usuarioRepositoryMock.update).toHaveBeenCalledWith({
        id: '1',
        status: 'INATIVO',
      });
    });
  });
});

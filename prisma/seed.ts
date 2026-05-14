import { prisma } from '../src/database/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Iniciando o seeding do banco de dados...');

  const hashedPassword = await bcrypt.hash('senha_segura_123', 10);

  // Criar usuários
  const alice = await prisma.usuario.upsert({
    where: { email: 'alice@exemplo.com' },
    update: { senha: hashedPassword },
    create: {
      nome: 'Alice Silva',
      senha: hashedPassword,
      email: 'alice@exemplo.com',
      cpf: '111.111.111-11',
      whatsapp: '11999999999',
      curso: 'Ciência da Computação',
      status: 'ATIVO',
      dataNascimento: new Date('2000-01-01'),
      role: 'ADMIN',
    },
  });

  const bob = await prisma.usuario.upsert({
    where: { email: 'bob@exemplo.com' },
    update: { senha: hashedPassword },
    create: {
      nome: 'Bob Souza',
      senha: hashedPassword,
      email: 'bob@exemplo.com',
      cpf: '222.222.222-22',
      whatsapp: '11888888888',
      curso: 'Engenharia de Software',
      status: 'ATIVO',
      dataNascimento: new Date('1999-05-15'),
      role: 'USER',
    },
  });

  // Criar veículo para Alice
  const veiculoAlice = await prisma.veiculo.upsert({
    where: { placa: 'ABC-1234' },
    update: {},
    create: {
      placa: 'ABC-1234',
      marca: 'Volkswagen',
      modelo: 'Gol',
      cor: 'Branco',
      proprietarioId: alice.id,
    },
  });

  // Limpar caronas e reservas antigas para evitar erros de duplicidade ou FK no seed
  await prisma.reserva.deleteMany({});
  await prisma.carona.deleteMany({});

  // Criar uma carona (Alice como motorista)
  const carona = await prisma.carona.create({
    data: {
      origem: 'Universidade - Campus Principal',
      destino: 'Centro da Cidade',
      dataHoraSaida: new Date(Date.now() + 1000 * 60 * 60 * 24), // Amanhã
      assentosDisponiveis: 3,
      valorAjuda: 5.0,
      status: 'AGENDADA',
      motoristaId: alice.id,
      veiculoId: veiculoAlice.id,
    },
  });

  // Criar uma reserva (Bob como passageiro)
  await prisma.reserva.create({
    data: {
      status: 'CONFIRMADA',
      quantidadePessoas: 1,
      caronaId: carona.id,
      usuarioId: bob.id,
    },
  });

  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

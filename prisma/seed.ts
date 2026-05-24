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
      cpf: '35060410006', // Valid CPF for testing
      matricula: '20201001',
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
      cpf: '20757270081', // Valid CPF for testing
      matricula: '20201002',
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

  // Limpar dados antigos na ordem correta para evitar erros de FK
  await prisma.avaliacao.deleteMany({});
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

  // Criar uma reserva (Bob como passageiro) na primeira carona
  await prisma.reserva.create({
    data: {
      status: 'CONFIRMADA',
      quantidadePessoas: 1,
      caronaId: carona.id,
      usuarioId: bob.id,
    },
  });

  // Criar uma carona finalizada
  const caronaFinalizada = await prisma.carona.create({
    data: {
      origem: 'Centro da Cidade',
      destino: 'Shopping',
      dataHoraSaida: new Date(Date.now() - 1000 * 60 * 60 * 24), // Ontem
      assentosDisponiveis: 2,
      valorAjuda: 10.0,
      status: 'FINALIZADA',
      motoristaId: alice.id,
      veiculoId: veiculoAlice.id,
    },
  });

  // Criar reserva confirmada para a carona finalizada
  await prisma.reserva.create({
    data: {
      status: 'CONFIRMADA',
      quantidadePessoas: 1,
      caronaId: caronaFinalizada.id,
      usuarioId: bob.id,
    },
  });

  // Bob avalia Alice
  await prisma.avaliacao.create({
    data: {
      caronaId: caronaFinalizada.id,
      avaliadorId: bob.id,
      avaliadoId: alice.id,
      nota: 5,
      comentario: 'Excelente motorista, super pontual e gentil!',
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

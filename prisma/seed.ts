import { prisma } from '../src/database/db';

async function main() {
  console.log('Iniciando o seeding do banco de dados...');

  // Criar usuários
  const alice = await prisma.usuario.upsert({
    where: { email: 'alice@exemplo.com' },
    update: {},
    create: {
      nome: 'Alice Silva',
      senha: 'senha_segura_123',
      email: 'alice@exemplo.com',
      cpf: '111.111.111-11',
      whatsapp: '11999999999',
      curso: 'Ciência da Computação',
      status: 'ATIVO',
      dataNascimento: new Date('2000-01-01'),
    },
  });

  const bob = await prisma.usuario.upsert({
    where: { email: 'bob@exemplo.com' },
    update: {},
    create: {
      nome: 'Bob Souza',
      senha: 'senha_segura_123',
      email: 'bob@exemplo.com',
      cpf: '222.222.222-22',
      whatsapp: '11888888888',
      curso: 'Engenharia de Software',
      status: 'ATIVO',
      dataNascimento: new Date('1999-05-15'),
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
  const reserva = await prisma.reserva.create({
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

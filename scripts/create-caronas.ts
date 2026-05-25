import { prisma } from '../src/database/db';

async function main() {
  const alice = await prisma.usuario.findUnique({ where: { email: 'alice@exemplo.com' } });
  const veiculo = await prisma.veiculo.findUnique({ where: { placa: 'ABC-1234' } });

  if (!alice || !veiculo) {
    console.error('Usuários ou veículo padrão não encontrados. Execute: npx prisma db seed');
    process.exit(1);
  }

  for (let i = 1; i <= 3; i++) {
    await prisma.carona.create({
      data: {
        origem: `Origem Teste ${i}`,
        destino: `Destino Teste ${i}`,
        dataHoraSaida: new Date(Date.now() + 1000 * 60 * 60 * 24 * i),
        assentosDisponiveis: 4,
        valorAjuda: 12.5,
        status: 'AGENDADA',
        motoristaId: alice.id,
        veiculoId: veiculo.id,
      },
    });
  }

  console.log('3 novas caronas criadas com sucesso.');
}

main()
  .catch((error) => {
    console.error('Erro ao criar caronas:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

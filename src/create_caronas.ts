import { prisma } from './database/db';

async function main() {
  const alice = await prisma.usuario.findUnique({ where: { email: 'alice@exemplo.com' } });
  const bob = await prisma.usuario.findUnique({ where: { email: 'bob@exemplo.com' } });
  const veiculo = await prisma.veiculo.findUnique({ where: { placa: 'ABC-1234' } });

  if (!alice || !bob || !veiculo) {
    console.log("Usuários ou veículo padrão não encontrados. Por favor rode os seeds primeiro.");
    return;
  }

  for (let i = 1; i <= 3; i++) {
    await prisma.carona.create({
      data: {
        origem: `Origem Teste ${i}`,
        destino: `Destino Teste ${i}`,
        dataHoraSaida: new Date(Date.now() + 1000 * 60 * 60 * 24 * i),
        assentosDisponiveis: 4,
        valorAjuda: 12.50,
        status: 'AGENDADA',
        motoristaId: alice.id,
        veiculoId: veiculo.id,
      }
    });
  }

  console.log("3 novas caronas criadas com sucesso!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

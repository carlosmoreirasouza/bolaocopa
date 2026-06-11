import { prisma } from "../lib/prisma";

const matches = [
  { round: "Rodada 1", homeTeam: "Brasil", awayTeam: "Sérvia", startsAt: "2026-06-14T19:00:00.000Z" },
  { round: "Rodada 1", homeTeam: "Argentina", awayTeam: "México", startsAt: "2026-06-15T22:00:00.000Z" },
  { round: "Rodada 1", homeTeam: "França", awayTeam: "Dinamarca", startsAt: "2026-06-16T19:00:00.000Z" },
  { round: "Rodada 2", homeTeam: "Brasil", awayTeam: "Suíça", startsAt: "2026-06-20T19:00:00.000Z" },
  { round: "Rodada 2", homeTeam: "Espanha", awayTeam: "Alemanha", startsAt: "2026-06-21T22:00:00.000Z" },
  { round: "Rodada 3", homeTeam: "Brasil", awayTeam: "Camarões", startsAt: "2026-06-25T19:00:00.000Z" }
];

async function main() {
  for (const match of matches) {
    await prisma.match.upsert({
      where: {
        id: `${match.homeTeam}-${match.awayTeam}-${match.startsAt}`
      },
      update: {},
      create: {
        id: `${match.homeTeam}-${match.awayTeam}-${match.startsAt}`,
        ...match,
        startsAt: new Date(match.startsAt)
      }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

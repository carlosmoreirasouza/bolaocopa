import { prisma } from "./prisma";
import { calculateBasePoints, findBonusPredictionIds } from "./scoring";

export async function recalculateMatchPoints(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { predictions: true }
  });

  if (!match || match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) return;

  const bonusIds = findBonusPredictionIds(match, match.predictions);

  await prisma.$transaction(
    match.predictions.map((prediction) => {
      const base = calculateBasePoints(match, prediction);
      const bonusPoint = bonusIds.has(prediction.id);

      return prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          points: base.points + (bonusPoint ? 1 : 0),
          exactScore: base.exactScore,
          winnerHit: base.winnerHit,
          bonusPoint
        }
      });
    })
  );
}

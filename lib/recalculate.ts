import { prisma } from "./prisma";
import { calculateBasePoints, findBonusPredictionIds } from "./scoring";

type PredictionForRecalculation = {
  id: string;
  homeScore: number;
  awayScore: number;
};

type FinishedMatchForRecalculation = {
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  predictions: PredictionForRecalculation[];
};

export async function recalculateMatchPoints(matchId: string) {
  const match: FinishedMatchForRecalculation | null = await prisma.match.findUnique({
    where: { id: matchId },
    include: { predictions: true }
  });

  if (!match || match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) return;

  const bonusIds = findBonusPredictionIds(match, match.predictions);

  await prisma.$transaction(
    match.predictions.map((prediction: PredictionForRecalculation) => {
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

import type { Match, Prediction } from "@prisma/client";

type Score = Pick<Match, "homeScore" | "awayScore">;
type Guess = Pick<Prediction, "homeScore" | "awayScore">;

function winner(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return "HOME";
  if (awayScore > homeScore) return "AWAY";
  return "DRAW";
}

function goalsForActualWinner(match: Score, prediction: Guess) {
  if (match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore > match.awayScore) return { actual: match.homeScore, guessed: prediction.homeScore };
  if (match.awayScore > match.homeScore) return { actual: match.awayScore, guessed: prediction.awayScore };
  return { actual: match.homeScore, guessed: prediction.homeScore };
}

export function calculateBasePoints(match: Score, prediction: Guess) {
  if (match.homeScore === null || match.awayScore === null) {
    return { points: 0, exactScore: false, winnerHit: false };
  }

  const exactScore = match.homeScore === prediction.homeScore && match.awayScore === prediction.awayScore;
  const winnerHit = winner(match.homeScore, match.awayScore) === winner(prediction.homeScore, prediction.awayScore);

  return {
    points: exactScore ? 3 : winnerHit ? 1 : 0,
    exactScore,
    winnerHit
  };
}

export function findBonusPredictionIds(match: Score, predictions: Array<Prediction>) {
  if (match.homeScore === null || match.awayScore === null || predictions.length === 0) return new Set<string>();

  const hasExactHit = predictions.some(
    (prediction) => prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore
  );

  if (hasExactHit) return new Set<string>();

  const distances = predictions.map((prediction) => {
    const goals = goalsForActualWinner(match, prediction);
    return { id: prediction.id, distance: goals ? Math.abs(goals.guessed - goals.actual) : Number.MAX_SAFE_INTEGER };
  });
  const bestDistance = Math.min(...distances.map((item) => item.distance));

  return new Set(distances.filter((item) => item.distance === bestDistance).map((item) => item.id));
}

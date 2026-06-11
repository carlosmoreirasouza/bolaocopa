import { prisma } from "@/lib/prisma";

type UserWithPredictions = {
  id: string;
  name: string;
  email: string;
  predictions: Array<{ points: number }>;
};

type RankingEntry = {
  id: string;
  name: string;
  email: string;
  predictions: number;
  points: number;
};

export default async function RankingPage() {
  const users: UserWithPredictions[] = await prisma.user.findMany({
    include: { predictions: true }
  });

  const ranking: RankingEntry[] = users
    .map((user: UserWithPredictions) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      predictions: user.predictions.length,
      points: user.predictions.reduce((total: number, prediction: { points: number }) => total + prediction.points, 0)
    }))
    .sort((a: RankingEntry, b: RankingEntry) => b.points - a.points || b.predictions - a.predictions || a.name.localeCompare(b.name));

  return (
    <section>
      <h1>Ranking</h1>
      <p className="muted">Classificação geral dos participantes pelo total de pontos.</p>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Posição</th>
              <th>Usuário</th>
              <th>Palpites</th>
              <th>Pontos</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((user: RankingEntry, index: number) => (
              <tr key={user.id}>
                <td>{index + 1}º</td>
                <td>{user.name}</td>
                <td>{user.predictions}</td>
                <td><strong>{user.points}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

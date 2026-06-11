import { prisma } from "@/lib/prisma";

export default async function RankingPage() {
  const users = await prisma.user.findMany({
    include: { predictions: true }
  });

  const ranking = users
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      predictions: user.predictions.length,
      points: user.predictions.reduce((total, prediction) => total + prediction.points, 0)
    }))
    .sort((a, b) => b.points - a.points || b.predictions - a.predictions || a.name.localeCompare(b.name));

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
            {ranking.map((user, index) => (
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

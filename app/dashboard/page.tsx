import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const [summary, predictions] = await Promise.all([
    prisma.prediction.aggregate({ where: { userId: user.id }, _sum: { points: true }, _count: true }),
    prisma.prediction.findMany({
      where: { userId: user.id },
      orderBy: { match: { startsAt: "asc" } },
      include: { match: true }
    })
  ]);

  return (
    <section>
      <h1>Minha área</h1>
      <p className="muted">Olá, {user.name}. Aqui estão seus palpites e pontos acumulados.</p>
      <div className="grid">
        <div className="card">
          <h2>{summary._sum.points ?? 0}</h2>
          <p className="muted">pontos totais</p>
        </div>
        <div className="card">
          <h2>{summary._count}</h2>
          <p className="muted">palpites cadastrados</p>
        </div>
        <div className="card">
          <h2>Ações</h2>
          <p><Link className="button-link" href="/palpites">Cadastrar palpites</Link></p>
        </div>
      </div>
      <div className="card">
        <h2>Meus palpites</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Jogo</th>
              <th>Palpite</th>
              <th>Resultado</th>
              <th>Pontos</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((prediction) => (
              <tr key={prediction.id}>
                <td>{prediction.match.homeTeam} x {prediction.match.awayTeam}</td>
                <td>{prediction.homeScore} x {prediction.awayScore}</td>
                <td>{prediction.match.status === "FINISHED" ? `${prediction.match.homeScore} x ${prediction.match.awayScore}` : "Em aberto"}</td>
                <td>{prediction.points}{prediction.bonusPoint ? " (+bônus)" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

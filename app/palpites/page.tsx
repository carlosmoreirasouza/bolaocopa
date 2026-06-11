import Link from "next/link";
import { PredictionForm } from "@/components/prediction-form";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PredictionsPage() {
  const user = await getCurrentUser();
  const matches = await prisma.match.findMany({
    orderBy: [{ startsAt: "asc" }],
    include: { predictions: { where: { userId: user?.id ?? "__anonymous__" } } }
  });

  return (
    <section>
      <h1>Palpites dos jogos</h1>
      <p className="muted">Escolha o placar de cada jogo pré-cadastrado. Palpites podem ser alterados até a partida ser finalizada.</p>
      {!user && (
        <div className="card">
          Faça <Link href="/login">login</Link> ou <Link href="/register">cadastro</Link> para salvar seus palpites.
        </div>
      )}
      <div className="match-list">
        {matches.map((match) => {
          const prediction = match.predictions[0];
          return (
            <article className="card match-card" key={match.id}>
              <div>
                <span className="badge">{match.round}</span>
                <p className="teams">{match.homeTeam} x {match.awayTeam}</p>
                <p className="muted">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short" }).format(match.startsAt)}</p>
                {match.status === "FINISHED" && <p>Resultado: {match.homeScore} x {match.awayScore}</p>}
              </div>
              {user ? (
                match.status === "FINISHED" ? (
                  <p className="muted">Partida encerrada. Pontos: {prediction?.points ?? 0}</p>
                ) : (
                  <PredictionForm
                    defaultAwayScore={prediction?.awayScore}
                    defaultHomeScore={prediction?.homeScore}
                    matchId={match.id}
                  />
                )
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

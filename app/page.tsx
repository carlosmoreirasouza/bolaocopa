import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <h1>Organize seu bolão da Copa com palpites, pontuação e ranking.</h1>
      <p>
        Cada usuário cria uma conta, registra palpites para jogos pré-cadastrados e acompanha a pontuação conforme os
        critérios do bolão.
      </p>
      <div className="grid">
        <div className="card">
          <h3>Placar exato</h3>
          <p className="muted">Acertou o resultado completo? São 3 pontos automáticos.</p>
        </div>
        <div className="card">
          <h3>Vencedor correto</h3>
          <p className="muted">Acertou apenas o vencedor ou empate? Garante 1 ponto.</p>
        </div>
        <div className="card">
          <h3>Bônus da rodada</h3>
          <p className="muted">Se ninguém cravar o placar, o mais próximo dos gols do vencedor ganha 1 ponto extra.</p>
        </div>
      </div>
      <p>
        <Link className="button-link" href="/register">
          Começar agora
        </Link>
      </p>
    </section>
  );
}

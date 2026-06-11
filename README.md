# Bolão da Copa

Aplicação Next.js com PostgreSQL local para cadastro de usuários, palpites em jogos pré-estabelecidos e ranking por pontuação.

## Funcionalidades

- Cadastro e login com e-mail e senha.
- Jogos da Copa pré-cadastrados via seed do Prisma.
- Registro e edição de palpites enquanto a partida estiver aberta.
- Ranking geral por pontos.
- Fechamento de partida por API administrativa, com recálculo automático dos pontos.

## Critérios de pontuação

- Placar exato: 3 pontos.
- Apenas vencedor correto: 1 ponto.
- Sem acerto de vencedor nem placar: 0 ponto.
- Bônus: se ninguém acertar o placar exato da partida, o palpite mais próximo do número de gols do time vencedor recebe 1 ponto adicional. Em caso de empate na proximidade, todos os empatados recebem o bônus.

## Como rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env` com base no `.env.example` e ajuste o `DATABASE_URL` para seu PostgreSQL local.

3. Rode a migração e popule os jogos:

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

4. Inicie o Next.js:

```bash
npm run dev
```

## Fechar uma partida e calcular pontos

Depois que usuários cadastrarem palpites, envie o resultado final para a API:

```bash
curl -X PATCH http://localhost:3000/api/matches/ID_DA_PARTIDA/result \
  -H 'Content-Type: application/json' \
  -H 'x-admin-token: token-opcional-para-fechar-jogos' \
  -d '{"homeScore":2,"awayScore":1}'
```

Se `ADMIN_RESULT_TOKEN` não estiver definido, a rota aceita o fechamento sem cabeçalho administrativo para facilitar o desenvolvimento local.

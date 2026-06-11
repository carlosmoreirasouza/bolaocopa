import { randomUUID } from "node:crypto";

const { Pool } = require("pg") as {
  Pool: new (config?: { connectionString?: string }) => {
    query: <T = Record<string, unknown>>(text: string, values?: unknown[]) => Promise<{ rows: T[] }>;
    end: () => Promise<void>;
  };
};

type SortDirection = "asc" | "desc";
type QueryOptions = Record<string, unknown>;

type UserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

type MatchRow = {
  id: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type PredictionRow = {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  points: number;
  exactScore: boolean;
  winnerHit: boolean;
  bonusPoint: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type PredictionWithMatch = PredictionRow & { match: MatchRow };
type MatchWithPredictions = MatchRow & { predictions: PredictionRow[] };
type UserWithPredictions = UserRow & { predictions: PredictionRow[] };

const globalForDatabase = globalThis as unknown as { databasePool?: InstanceType<typeof Pool> };

function getPool() {
  if (!globalForDatabase.databasePool) {
    globalForDatabase.databasePool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  return globalForDatabase.databasePool;
}

async function query<T = Record<string, unknown>>(text: string, values?: unknown[]) {
  return getPool().query<T>(text, values);
}

function toLimitClause(options?: QueryOptions) {
  const take = options?.take;
  return typeof take === "number" && Number.isInteger(take) && take > 0 ? ` LIMIT ${take}` : "";
}

function matchOrderClause(options?: QueryOptions) {
  const orderBy = options?.orderBy;

  if (Array.isArray(orderBy) && orderBy.some((order) => (order as { startsAt?: SortDirection }).startsAt === "desc")) {
    return ` ORDER BY m."startsAt" DESC`;
  }

  return ` ORDER BY m."startsAt" ASC`;
}

function mapUser(row: Record<string, unknown>): UserRow {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    passwordHash: row.passwordHash as string,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date
  };
}

function mapMatch(row: Record<string, unknown>, prefix = ""): MatchRow {
  return {
    id: row[`${prefix}id`] as string,
    round: row[`${prefix}round`] as string,
    homeTeam: row[`${prefix}homeTeam`] as string,
    awayTeam: row[`${prefix}awayTeam`] as string,
    startsAt: row[`${prefix}startsAt`] as Date,
    status: row[`${prefix}status`] as string,
    homeScore: row[`${prefix}homeScore`] as number | null,
    awayScore: row[`${prefix}awayScore`] as number | null,
    createdAt: row[`${prefix}createdAt`] as Date,
    updatedAt: row[`${prefix}updatedAt`] as Date
  };
}

function mapPrediction(row: Record<string, unknown>, prefix = ""): PredictionRow {
  return {
    id: row[`${prefix}id`] as string,
    userId: row[`${prefix}userId`] as string,
    matchId: row[`${prefix}matchId`] as string,
    homeScore: row[`${prefix}homeScore`] as number,
    awayScore: row[`${prefix}awayScore`] as number,
    points: row[`${prefix}points`] as number,
    exactScore: row[`${prefix}exactScore`] as boolean,
    winnerHit: row[`${prefix}winnerHit`] as boolean,
    bonusPoint: row[`${prefix}bonusPoint`] as boolean,
    createdAt: row[`${prefix}createdAt`] as Date,
    updatedAt: row[`${prefix}updatedAt`] as Date
  };
}

async function findPredictionsByMatchId(matchId: string) {
  const { rows } = await query<PredictionRow>(`SELECT * FROM "Prediction" WHERE "matchId" = $1 ORDER BY "createdAt" ASC`, [matchId]);
  return rows.map((row) => mapPrediction(row));
}

const database = {
  user: {
    async findUnique(options: { where: { id?: string; email?: string }; select?: Record<string, boolean> }) {
      const { id, email } = options.where;
      const { rows } = id
        ? await query<UserRow>(`SELECT * FROM "User" WHERE "id" = $1 LIMIT 1`, [id])
        : await query<UserRow>(`SELECT * FROM "User" WHERE "email" = $1 LIMIT 1`, [email]);
      const user = rows[0] ? mapUser(rows[0]) : null;

      if (!user || !options.select) return user;

      return Object.fromEntries(Object.entries(user).filter(([key]) => options.select?.[key])) as Partial<UserRow>;
    },
    async findMany(options?: { include?: { predictions?: boolean } }) {
      const { rows } = await query<UserRow>(`SELECT * FROM "User" ORDER BY "name" ASC`);
      const users = rows.map((row) => mapUser(row));

      if (!options?.include?.predictions) return users;

      return Promise.all(
        users.map(async (user): Promise<UserWithPredictions> => {
          const { rows: predictions } = await query<PredictionRow>(`SELECT * FROM "Prediction" WHERE "userId" = $1`, [user.id]);
          return { ...user, predictions: predictions.map((prediction) => mapPrediction(prediction)) };
        })
      );
    },
    async create(options: { data: { name: string; email: string; passwordHash: string } }) {
      const { name, email, passwordHash } = options.data;
      const { rows } = await query<UserRow>(
        `INSERT INTO "User" ("id", "name", "email", "passwordHash", "updatedAt") VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [randomUUID(), name, email, passwordHash]
      );

      return mapUser(rows[0]);
    }
  },
  match: {
    async findMany(options?: { orderBy?: Array<{ startsAt?: SortDirection }>; include?: { predictions?: { where?: { userId?: string } } } }) {
      const { rows } = await query<MatchRow>(`SELECT m.* FROM "Match" m${matchOrderClause(options)}${toLimitClause(options)}`);
      const matches = rows.map((row) => mapMatch(row));

      if (!options?.include?.predictions) return matches;

      return Promise.all(
        matches.map(async (match): Promise<MatchWithPredictions> => {
          const userId = options.include?.predictions?.where?.userId;
          const { rows: predictions } = userId
            ? await query<PredictionRow>(`SELECT * FROM "Prediction" WHERE "matchId" = $1 AND "userId" = $2`, [match.id, userId])
            : await query<PredictionRow>(`SELECT * FROM "Prediction" WHERE "matchId" = $1`, [match.id]);
          return { ...match, predictions: predictions.map((prediction) => mapPrediction(prediction)) };
        })
      );
    },
    async findUnique(options: { where: { id: string }; include?: { predictions?: boolean } }) {
      const { rows } = await query<MatchRow>(`SELECT * FROM "Match" WHERE "id" = $1 LIMIT 1`, [options.where.id]);
      const match = rows[0] ? mapMatch(rows[0]) : null;

      if (!match || !options.include?.predictions) return match;

      return { ...match, predictions: await findPredictionsByMatchId(match.id) };
    },
    async update(options: { where: { id: string }; data: { status?: string; homeScore?: number; awayScore?: number } }) {
      const { rows } = await query<MatchRow>(
        `UPDATE "Match" SET "status" = COALESCE($2, "status"), "homeScore" = COALESCE($3, "homeScore"), "awayScore" = COALESCE($4, "awayScore"), "updatedAt" = NOW() WHERE "id" = $1 RETURNING *`,
        [options.where.id, options.data.status, options.data.homeScore, options.data.awayScore]
      );

      if (!rows[0]) throw new Error("Partida não encontrada");
      return mapMatch(rows[0]);
    },
    async upsert(options: { where: { id: string }; update: Partial<MatchRow>; create: { id: string; round: string; homeTeam: string; awayTeam: string; startsAt: Date } }) {
      const { id, round, homeTeam, awayTeam, startsAt } = options.create;
      const { rows } = await query<MatchRow>(
        `INSERT INTO "Match" ("id", "round", "homeTeam", "awayTeam", "startsAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT ("id") DO UPDATE SET "updatedAt" = "Match"."updatedAt" RETURNING *`,
        [id, round, homeTeam, awayTeam, startsAt]
      );

      return mapMatch(rows[0]);
    }
  },
  prediction: {
    async aggregate(options: { where: { userId: string }; _sum: { points: true }; _count: true }) {
      const { rows } = await query<{ points: number | null; count: string }>(
        `SELECT SUM("points")::int AS points, COUNT(*)::text AS count FROM "Prediction" WHERE "userId" = $1`,
        [options.where.userId]
      );

      return { _sum: { points: rows[0]?.points ?? null }, _count: Number(rows[0]?.count ?? 0) };
    },
    async findMany(options: { where: { userId?: string; matchId?: string }; orderBy?: { match?: { startsAt?: SortDirection } }; include?: { match?: boolean } }) {
      if (options.include?.match) {
        const direction = options.orderBy?.match?.startsAt === "desc" ? "DESC" : "ASC";
        const { rows } = await query<Record<string, unknown>>(
          `SELECT p.*, m."id" AS "match_id", m."round" AS "match_round", m."homeTeam" AS "match_homeTeam", m."awayTeam" AS "match_awayTeam", m."startsAt" AS "match_startsAt", m."status" AS "match_status", m."homeScore" AS "match_homeScore", m."awayScore" AS "match_awayScore", m."createdAt" AS "match_createdAt", m."updatedAt" AS "match_updatedAt" FROM "Prediction" p INNER JOIN "Match" m ON m."id" = p."matchId" WHERE p."userId" = $1 ORDER BY m."startsAt" ${direction}`,
          [options.where.userId]
        );

        return rows.map((row): PredictionWithMatch => ({ ...mapPrediction(row), match: mapMatch(row, "match_") }));
      }

      const clauses = [];
      const values: unknown[] = [];
      if (options.where.userId) {
        values.push(options.where.userId);
        clauses.push(`"userId" = $${values.length}`);
      }
      if (options.where.matchId) {
        values.push(options.where.matchId);
        clauses.push(`"matchId" = $${values.length}`);
      }
      const { rows } = await query<PredictionRow>(`SELECT * FROM "Prediction" WHERE ${clauses.join(" AND ") || "TRUE"}`, values);
      return rows.map((row) => mapPrediction(row));
    },
    async upsert(options: { where: { userId_matchId: { userId: string; matchId: string } }; update: { homeScore: number; awayScore: number }; create: { userId: string; matchId: string; homeScore: number; awayScore: number } }) {
      const { userId, matchId } = options.where.userId_matchId;
      const { homeScore, awayScore } = options.create;
      const { rows } = await query<PredictionRow>(
        `INSERT INTO "Prediction" ("id", "userId", "matchId", "homeScore", "awayScore", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT ("userId", "matchId") DO UPDATE SET "homeScore" = EXCLUDED."homeScore", "awayScore" = EXCLUDED."awayScore", "updatedAt" = NOW() RETURNING *`,
        [randomUUID(), userId, matchId, homeScore, awayScore]
      );

      return mapPrediction(rows[0]);
    },
    async update(options: { where: { id: string }; data: { points: number; exactScore: boolean; winnerHit: boolean; bonusPoint: boolean } }) {
      const { rows } = await query<PredictionRow>(
        `UPDATE "Prediction" SET "points" = $2, "exactScore" = $3, "winnerHit" = $4, "bonusPoint" = $5, "updatedAt" = NOW() WHERE "id" = $1 RETURNING *`,
        [options.where.id, options.data.points, options.data.exactScore, options.data.winnerHit, options.data.bonusPoint]
      );

      if (!rows[0]) throw new Error("Palpite não encontrado");
      return mapPrediction(rows[0]);
    }
  },
  async $transaction<T>(operations: Array<Promise<T>>) {
    return Promise.all(operations);
  },
  async $disconnect() {
    await getPool().end();
    globalForDatabase.databasePool = undefined;
  }
};

export const prisma: any = database;

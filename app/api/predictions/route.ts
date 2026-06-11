import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateMatchPoints } from "@/lib/recalculate";

const predictionSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0).max(30),
  awayScore: z.coerce.number().int().min(0).max(30)
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para salvar palpites" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = predictionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Palpite inválido" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: parsed.data.matchId } });

  if (!match) {
    return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
  }

  if (match.status === "FINISHED") {
    return NextResponse.json({ error: "Esta partida já foi encerrada" }, { status: 409 });
  }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: user.id, matchId: parsed.data.matchId } },
    update: { homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore },
    create: {
      userId: user.id,
      matchId: parsed.data.matchId,
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore
    }
  });

  await recalculateMatchPoints(parsed.data.matchId);

  return NextResponse.json({ ok: true });
}

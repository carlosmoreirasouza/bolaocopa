import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recalculateMatchPoints } from "@/lib/recalculate";

const resultSchema = z.object({
  homeScore: z.coerce.number().int().min(0).max(30),
  awayScore: z.coerce.number().int().min(0).max(30)
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminToken = process.env.ADMIN_RESULT_TOKEN;

  if (adminToken && request.headers.get("x-admin-token") !== adminToken) {
    return NextResponse.json({ error: "Token administrativo inválido" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = resultSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Resultado inválido" }, { status: 400 });
  }

  const { id } = await params;
  await prisma.match.update({
    where: { id },
    data: {
      status: "FINISHED",
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore
    }
  });

  await recalculateMatchPoints(id);

  return NextResponse.json({ ok: true });
}

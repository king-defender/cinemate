import { prisma } from "@/lib/prisma";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function checkRateLimit(
  key: string,
  limit: number,
): Promise<{ ok: boolean; remaining: number }> {
  const now = new Date();
  const row = await prisma.rateLimit.findUnique({ where: { id: key } });

  if (!row || now.getTime() - row.windowStart.getTime() > WINDOW_MS) {
    await prisma.rateLimit.upsert({
      where: { id: key },
      create: { id: key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return { ok: true, remaining: limit - 1 };
  }

  if (row.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  await prisma.rateLimit.update({
    where: { id: key },
    data: { count: { increment: 1 } },
  });

  return { ok: true, remaining: limit - row.count - 1 };
}

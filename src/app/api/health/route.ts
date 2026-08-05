import { prisma } from "@/lib/prisma";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.includes("@")
    ? url.split("@")[1]?.split("/")[0]?.split("?")[0]
    : "missing";

  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, host });
  } catch (e) {
    return Response.json(
      {
        ok: false,
        host,
        error: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 },
    );
  }
}

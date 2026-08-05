import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  // One query instead of findMany + count (saves a Seoul RTT)
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return Response.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const body = (await req.json().catch(() => null)) as {
    ids?: string[];
    all?: boolean;
  } | null;

  if (body?.all) {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  } else if (body?.ids?.length) {
    await prisma.notification.updateMany({
      where: { userId: user.id, id: { in: body.ids } },
      data: { read: true },
    });
  } else {
    return apiError("VALIDATION", "ids or all required", 400);
  }

  return Response.json({ ok: true });
}

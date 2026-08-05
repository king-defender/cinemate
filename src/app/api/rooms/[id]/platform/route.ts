import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { platformSchema } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

const contentSchema = z.object({
  platform: platformSchema.shape.platform.optional(),
  contentUrl: z
    .string()
    .max(2000)
    .nullable()
    .optional()
    .refine(
      (v) => v == null || v === "" || /^https?:\/\//i.test(v),
      "URL must start with http(s)",
    ),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room || room.endedAt) {
    return apiError("NOT_FOUND", "Room not found", 404);
  }
  if (room.hostId !== user.id) {
    return apiError("FORBIDDEN", "Only the host can set the source", 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = contentSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", "Invalid platform or URL", 400);
  }

  const data = {
    ...(parsed.data.platform !== undefined && {
      platform: parsed.data.platform,
    }),
    ...(parsed.data.contentUrl !== undefined && {
      contentUrl:
        parsed.data.contentUrl === "" ? null : parsed.data.contentUrl,
    }),
  };

  const updated = await prisma.room.update({
    where: { id },
    data,
  });

  return Response.json({
    platform: updated.platform,
    contentUrl: updated.contentUrl,
  });
}

import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id } = await params;
  const request = await prisma.buddyRequest.findUnique({ where: { id } });
  if (!request) return apiError("NOT_FOUND", "Request not found", 404);
  if (request.requesterId !== user.id) {
    return apiError("FORBIDDEN", "Not your request", 403);
  }
  if (request.status !== "open") {
    return apiError("CONFLICT", "Request is no longer open", 409);
  }

  await prisma.buddyRequest.update({
    where: { id },
    data: { status: "cancelled" },
  });

  return Response.json({ ok: true });
}

import { prisma } from "@/lib/prisma";

type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
    },
  });
}

export async function createNotifications(
  inputs: CreateNotificationInput[],
) {
  if (inputs.length === 0) return;
  await prisma.notification.createMany({ data: inputs });
}

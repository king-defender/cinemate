import { prisma } from "@/lib/prisma";

const BADGE_DEFS = [
  {
    name: "First Watch",
    description: "Joined your first watch room",
    check: async (userId: string) => {
      const count = await prisma.roomMember.count({ where: { userId } });
      return count >= 1;
    },
  },
  {
    name: "Host Debut",
    description: "Hosted your first room",
    check: async (userId: string) => {
      const count = await prisma.room.count({ where: { hostId: userId } });
      return count >= 1;
    },
  },
  {
    name: "10 Rooms Hosted",
    description: "Hosted 10 rooms",
    check: async (userId: string) => {
      const count = await prisma.room.count({ where: { hostId: userId } });
      return count >= 10;
    },
  },
] as const;

async function ensureBadge(name: string, description: string) {
  return prisma.badge.upsert({
    where: { name },
    create: { name, description },
    update: { description },
  });
}

/** Idempotent badge evaluation — safe to call after relevant events. */
export async function evaluateBadges(userId: string) {
  for (const def of BADGE_DEFS) {
    const earned = await def.check(userId);
    if (!earned) continue;

    const badge = await ensureBadge(def.name, def.description);
    await prisma.userBadge.upsert({
      where: {
        userId_badgeId: { userId, badgeId: badge.id },
      },
      create: { userId, badgeId: badge.id },
      update: {},
    });
  }
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COMMUNITIES = [
  { name: "Horror Night", genre: "Horror" },
  { name: "Comfort Re-watches", genre: "Comedy" },
  { name: "Sci-Fi Signal", genre: "Sci-Fi" },
  { name: "Anime Watch Party", genre: "Anime" },
  { name: "Documentary Deep Dive", genre: "Documentary" },
];

const BADGES = [
  { name: "First Watch", description: "Joined your first watch room" },
  { name: "Host Debut", description: "Hosted your first room" },
  { name: "10 Rooms Hosted", description: "Hosted 10 rooms" },
];

async function main() {
  for (const c of COMMUNITIES) {
    await prisma.community.upsert({
      where: { name: c.name },
      create: c,
      update: { genre: c.genre },
    });
  }
  for (const b of BADGES) {
    await prisma.badge.upsert({
      where: { name: b.name },
      create: b,
      update: { description: b.description },
    });
  }
  console.log("Seeded communities + badges");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

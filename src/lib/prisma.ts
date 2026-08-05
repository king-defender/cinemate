import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is missing");
  }
  // Guard against a leftover pooler username in the process env
  if (url.includes("pooler.supabase.com") && url.includes("tenant")) {
    // no-op; real failures come from Supabase itself
  }
  return url;
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl() },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseSchema, getDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function assertDatabaseConfigured() {
  if (!getDatabaseUrl()) {
    throw new Error(
      "DATABASE_URL is not configured. Set it in .env before running migrations, seed, or the app.",
    );
  }
}

export function formatDatabaseError(error: unknown) {
  if (error instanceof Error) {
    if (!getDatabaseUrl()) return error.message;
    return `PostgreSQL connection failed: ${error.message}`;
  }

  return "PostgreSQL connection failed with an unknown error.";
}

const connectionString = getDatabaseUrl() ?? "";
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }, { schema: getDatabaseSchema() }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

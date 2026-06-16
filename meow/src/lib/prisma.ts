import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 1. Get your Pooled URL from .env
const connectionString = process.env.DATABASE_URL;

// Add this check to debug
if (!connectionString) {
  console.error("❌ DATABASE_URL is not defined in your .env file!");
} else {
  console.log("DB URL DETECTED!");
}

// 2. Setup the Postgres Pool (the 'engine')
const pool = new pg.Pool({ connectionString });

// 3. Setup the Prisma Adapter (the 'bridge')
const adapter = new PrismaPg(pool);

// 4. Create the Client singleton
const globalPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalPrisma.prisma = prisma;

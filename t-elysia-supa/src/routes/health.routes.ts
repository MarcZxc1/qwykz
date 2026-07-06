import { Elysia } from "elysia";
import { prisma } from "../lib/prisma";

export const healthRouter = new Elysia({ prefix: "/api/health" })
  .get("/", async ({ set }: any) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok", database: "connected" };
    } catch {
      set.status = 503;
      return { status: "error", database: "disconnected" };
    }
  });

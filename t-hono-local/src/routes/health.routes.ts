import { Hono } from "hono";
import { prisma } from "../lib/prisma";

export const healthRouter = new Hono();

healthRouter.get("/", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: "ok", database: "connected" });
  } catch {
    c.status(503);
    return c.json({ status: "error", database: "disconnected" });
  }
});

import { prisma } from "../lib/prisma";
{{REDIS_IMPORT}}

export const userService = {
  async list() {
{{REDIS_CACHE_CHECK}}
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
{{REDIS_CACHE_SET}}
    return users;
  },
  async create(data: { email: string; name?: string }) {
{{REDIS_CACHE_INVALIDATE}}
    return await prisma.user.create({ data });
  },
};

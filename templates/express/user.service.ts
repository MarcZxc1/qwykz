import { prisma } from "../lib/prisma";
{{REDIS_IMPORT}}

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userService = {
  async list() {
{{REDIS_CACHE_CHECK}}
    const users = await prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { createdAt: "desc" },
    });
{{REDIS_CACHE_SET}}
    return users;
  },
  async create(data: { email: string; name?: string }) {
{{REDIS_CACHE_INVALIDATE}}
    return await prisma.user.create({ data, select: publicUserSelect });
  },
};

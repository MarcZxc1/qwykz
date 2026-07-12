import { prisma } from "../lib/prisma";

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userService = {
  list() {
    return prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { createdAt: "desc" },
    });
  },
  create(data: { email: string; name?: string }) {
    return prisma.user.create({ data, select: publicUserSelect });
  },
};

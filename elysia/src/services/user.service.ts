import { prisma } from "../lib/prisma";

export const userService = {
  list() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
  create(data: { email: string; name?: string }) {
    return prisma.user.create({ data });
  },
};

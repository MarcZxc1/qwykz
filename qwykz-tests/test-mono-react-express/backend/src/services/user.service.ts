import { prisma } from "../lib/prisma";


export const userService = {
  async list() {

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return users;
  },
  async create(data: { email: string; name?: string }) {

    return await prisma.user.create({ data });
  },
};

import { NextResponse } from "next/server";
import { z } from "zod";
import { verify } from "argon2";
import { sign } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
}).strict();

export async function POST(req: Request) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "JWT_SECRET is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValidPassword = await verify(user.password, parsed.data.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = sign({ sub: user.id }, JWT_SECRET, { expiresIn: "15m" });

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      token,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

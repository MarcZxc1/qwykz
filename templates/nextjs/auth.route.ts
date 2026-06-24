import { NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";

// Zod Schema
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
}).strict();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await argon2.hash(parsed.password);

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      message: "User registered successfully",
      user: { id: user.id, email: user.email }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

**Role:**
You are an expert Node.js and Bun developer specializing in creating custom scaffolding CLIs and enterprise-grade Express.js backends.

**Objective:**
Write the complete source code for a modular CLI tool named "qwykz". This tool runs on Bun and generates a highly scalable, secure, and performant Express + TypeScript boilerplate. The generated boilerplate must enforce clean architecture, strict typing, and automated database initialization.

**CLI Workflow & Prompts:**
Use a modern prompting library (like `@clack/prompts` or `inquirer`) to guide the user through the following flow:

1. Ask for the **Project Name** (used to name the folder and in `package.json`).
2. Ask for the **Target Database Environment** (Select one):
   - Local PostgreSQL
   - Dockerized PostgreSQL (Must generate a `docker-compose.yml` for Postgres)
   - Supabase (Remote)
3. Ask to toggle **Pre-installed Packages** (Multi-select):
   - Zod (for request validation)
   - Helmet (for security headers)
   - CORS (for cross-origin requests)

**Generated Project Architecture:**
The CLI must generate a structured backend focused on separation of concerns. Include the following folders and files in the generated output:

- `src/controllers/`
- `src/services/`
- `src/routes/`
- `src/middlewares/` (Include standard error handling here)
- `src/lib/` (For singletons like Prisma)
- `src/index.ts` (Server bootstrap)
- `prisma/schema.prisma`

**Core Requirements & Constraints:**

1. **Bun First:** The generated project's `package.json` must use `bun dev` and `bun run` scripts. Do not use npm/npx or ts-node.
2. **Security & Validation:** If selected in the CLI, integrate `helmet` and `cors` immediately into `src/index.ts`. Setup a dummy route demonstrating `zod` schema validation in a controller.
3. **Prisma Auto-Initialization:** The generated server `src/index.ts` must import Prisma, perform a connection check (e.g., `prisma.$connect()`), and fail safely if the DB is unreachable before opening the Express port.
4. **Supabase Specific Configuration (CRITICAL):**
   If the user selects "Supabase" as their database target, you MUST add `pg` and `@prisma/adapter-pg` to the generated dependencies. Furthermore, you MUST use the exact following code to generate the `src/lib/prisma.ts` file:

   ```typescript
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
   ```

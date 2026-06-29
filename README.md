<div align="center">

# ⚡ qwykz ⚡
**Quick & Ready Boilerplate Builder**

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Laravel](https://img.shields.io/badge/laravel-%23FF2D20.svg?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![Vue](https://img.shields.io/badge/Vue.js-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)](https://vuejs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-%233ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A lightning-fast CLI tool built with [Bun](https://bun.sh) to instantly scaffold Enterprise-grade **Backend**, **Frontend**, and **Fullstack** applications. 

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Wiki / Docs](docs/home.md) • [Contributing](#contributing)

</div>

---

## Features

* **Multi-Stack Scaffolding**: Generate exact boilerplate architectures in **Backend** (Express, Hono, Elysia, Laravel, Python FastAPI, Go Fiber, Rust Axum), **Frontend** (React, Vue), or **Fullstack** (Next.js) environments.
* **Enterprise Architecture**: Automatically generates scalable Service/Controller/Model patterns for backend code right out of the box, standardizing best practices for every language.
* **Frontend Powerhouses**:
  * React & Vue apps are generated using high-speed Vite.
  * **Zero-config UI**: Tailwind CSS v4 is automatically injected and configured.
  * **Ready-to-use Auth**: Beautiful Login, Register, and Dashboard components are pre-built, integrating `@supabase/supabase-js` or `Clerk` natively.
  * **Strict Validation**: Zod schemas are automatically wired up to the frontend authentication forms.
* **Database Orchestration**: Intelligent, automated setup for your PostgreSQL environment:
  * **Local Installation**
  * **Fully Dockerized** (automatically assigns ports, boots containers, and waits for health checks)
  * **Supabase Cloud & Neon Serverless Postgres** (automatically formats connections and skips local migrations)
* **Out-of-the-Box API Security**: 
  * Express/Hono/Elysia: Prisma ORM, JWT authentication, Argon2 hashing, Helmet, CORS, and Zod validation with Role-Based Access Control.
  * Laravel: Silent Sanctum installation, automatic User model traits, and built-in Auth endpoints.
  * Python/Go/Rust: Native ORMs (SQLModel, Gorm, SQLx) natively wired with Bcrypt/Argon2 hashing and JWT Role-Based Access Control.
* **Non-Interactive Mode**: Fully scriptable via CLI flags for CI/CD or automated testing setups.

## Installation

### Run without installing (Recommended)
You can run `qwykz` directly using `bunx`:
```bash
bunx qwykz@latest
# or
bunx qwykz
```

### Global Install
If you prefer to install it globally:
```bash
bun install -g qwykz
```

## Usage

### Interactive Mode
Simply run the command and follow the beautiful CLI prompts:
```bash
qwykz
```
You will be prompted to:
1. Name your project
2. Select your Stack (Express, Hono, Elysia, Laravel, Python, Go, Rust, Next.js, React, or Vue)
3. Select your Database Target (Local, Docker, Supabase, Neon) or Frontend Auth (Clerk, Supabase)
4. Opt-in to extra features (Zod, Helmet, CORS) *[JS/TS Backends only]*

### Non-Interactive Mode (Automated)
Perfect for scripts or CI/CD pipelines! Use the `--yes` or `-y` flag combined with options:
```bash
qwykz --yes \
  --name my-awesome-api \
  --framework laravel \
  --db docker
```

Available flags:
* `--yes` or `-y`: Skip all prompts and use defaults/flags
* `--name <string>`: Name of your project directory
* `--framework <express|hono|elysia|laravel|python|go|rust|nextjs|react|vue>`: Choose your stack
* `--db <supabase|neon|local|docker|clerk>`: Select database/auth environment
* `--zod`, `--helmet`, `--cors`: Include extra middlewares

## Documentation

Check out the [Wiki Guides](docs/home.md) for deep dives into:
* [Architecture Overview](docs/architecture.md)
* [The Template Engine](docs/template-engine.md)
* [Dependency Resolution](docs/dependency-resolution.md)
* [Adding New Features](docs/contributing.md)

## Contributing

Contributions are welcome and appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
</div>

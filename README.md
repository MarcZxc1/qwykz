<div align="center">

# ⚡ qwykz ⚡
**Quick & Ready Boilerplate Builder**

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

A fast CLI tool built with [Bun](https://bun.sh) to instantly scaffold Express + Prisma applications. 

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Wiki / Docs](docs/home.md) • [Contributing](#contributing)

</div>

---

## Features

* **Fast**: Powered by Bun for quick execution and scaffolding.
* **Dynamic Dependencies**: Automatically fetches the latest stable versions from the npm registry for all your packages, with offline cache fallback.
* **Database Ready**: Choose your PostgreSQL setup:
  * Local Installation
  * Fully Dockerized (includes `docker-compose.yml` and wait scripts)
  * Supabase Cloud
* **Modern Stack**: 
  * TypeScript configured
  * Prisma ORM included
  * Built-in error handling middlewares
  * Helmet & CORS integration
  * Zod request validation
* **Built-in Auth**: Optional argon2 password hashing and JWT authentication.
* **Non-Interactive Mode**: Fully scriptable via CLI flags for CI/CD or automated setups.

## Installation

### Run without installing (Recommended)
You can run `qwykz` directly using `bunx`:
```bash
bunx qwykz@latest or bunx qwykz
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
2. Select your Database Target (Local, Docker, or Supabase)
3. Opt-in to Zod, Helmet, and CORS

### Non-Interactive Mode (Automated)
Perfect for scripts! Use the `--yes` or `-y` flag combined with options:
```bash
qwykz --yes \
  --name my-awesome-api \
  --db docker \
  --zod \
  --helmet \
  --cors
```

Available flags:
* `--yes` or `-y`: Skip all prompts and use defaults/flags
* `--name <string>`: Name of your project directory
* `--db <supabase|local|docker>`: Select database environment
* `--zod`: Include Zod validation
* `--helmet`: Include Helmet security headers
* `--cors`: Include CORS middleware

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

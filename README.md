<div align="center">

# ⚡ qwykz ⚡
**Quick & Ready Boilerplate Builder**

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Laravel](https://img.shields.io/badge/laravel-%23FF2D20.svg?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

A lightning-fast CLI tool built with [Bun](https://bun.sh) to instantly scaffold Enterprise-grade **Express** and **Laravel** APIs. 

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Wiki / Docs](docs/home.md) • [Contributing](#contributing)

</div>

---

## Features

* **Dual-Stack Scaffolding**: Generate exact 1-to-1 API architectures in either Node.js (Express) or PHP (Laravel 11). 
* **Enterprise Architecture**: Automatically generates a scalable Service/Controller pattern right out of the box.
* **Database Orchestration**: Intelligent, automated setup for your PostgreSQL environment:
  * **Local Installation**
  * **Fully Dockerized** (automatically assigns ports, boots containers, and waits for health checks)
  * **Supabase Cloud** (automatically formats IPv4 Pooler connections and skips local migrations)
* **Out-of-the-Box API Security**: 
  * Express: JWT authentication, Argon2 hashing, Helmet, CORS, and Zod validation.
  * Laravel: Silent Sanctum installation, automatic User model traits, and built-in Auth endpoints.
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
2. Select your Framework (Express or Vanilla Laravel)
3. Select your Database Target (Local, Docker, or Supabase)
4. (Express only) Opt-in to Zod, Helmet, and CORS

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
* `--framework <express|laravel>`: Choose your backend stack
* `--db <supabase|local|docker>`: Select database environment
* `--zod`, `--helmet`, `--cors`: (Express only) Include extra middlewares

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

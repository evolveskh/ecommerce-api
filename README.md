# express-api

A production-ready REST API built with Express, TypeScript, Prisma, and PostgreSQL.

## Stack

- **Runtime** — Bun
- **Framework** — Express 5
- **Language** — TypeScript (strict)
- **Database** — PostgreSQL via Docker
- **ORM** — Prisma 7
- **Validation** — Zod
- **Auth** — JWT + bcrypt
- **Testing** — Vitest + Supertest
- **Formatting** — Prettier

## Getting Started

### Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com)

### Setup

```bash
# clone and install
git clone <repo>
cd express-api
bun install

# start postgres
docker compose up -d

# run migrations
bunx prisma migrate dev

# generate prisma client
bunx prisma generate

# start dev server
bun run dev
```

### Environment Variables

Create a `.env` file in the root:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/express_api"
JWT_SECRET="your-super-secret-key"
```

## Scripts

| Command                | Description                    |
| ---------------------- | ------------------------------ |
| `bun run dev`          | Start server with watch mode   |
| `bun run start`        | Start server                   |
| `bun test`             | Run tests                      |
| `bun run typecheck`    | Type check without compiling   |
| `bun run format`       | Format all files with Prettier |
| `bun run format:check` | Check formatting               |

## API

### Auth

```
POST /auth/register   create account
POST /auth/login      get JWT token
```

### Users (protected)

```
GET  /users           get all users
GET  /users/:id       get user by id
```

### Health

```
GET  /health          server status
```

### Example

```bash
# register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Thym","email":"thym@example.com","password":"123456"}'

# login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"thym@example.com","password":"123456"}'

# use token
curl http://localhost:3000/users \
  -H "Authorization: Bearer <token>"
```

## Project Structure

```
express-api/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── generated/
│   │   └── prisma/
│   ├── lib/
│   │   └── prisma.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   └── users.ts
│   ├── schemas/
│   │   └── user.schema.ts
│   ├── services/
│   │   └── user.service.ts
│   ├── index.ts
│   └── server.ts
├── tests/
│   └── auth.test.ts
├── docker-compose.yml
└── .env
```

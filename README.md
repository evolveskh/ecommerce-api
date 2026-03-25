# ecommerce-api

A production-ready REST API built with Express, TypeScript, Prisma, and PostgreSQL.

## Stack

- **Runtime** — Bun
- **Framework** — Express 5
- **Language** — TypeScript (strict)
- **Database** — PostgreSQL via Docker
- **ORM** — Prisma 7
- **Validation** — Zod
- **Auth** — JWT + bcrypt
- **Email** — Nodemailer (order confirmation)
- **File Upload** — Multer (images: jpeg, png, webp, max 5MB)
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
cd ecommerce-api
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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce"
JWT_SECRET="your-super-secret-key"

# SMTP (order confirmation emails)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="no-reply@example.com"
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

### Users (admin only)

```
GET  /users           list all users
GET  /users/:id       get user by id
```

### Categories (admin: write, public: read)

```
GET    /categories        list all categories
GET    /categories/:id    get category with products
POST   /categories        create category
PUT    /categories/:id    update category
DELETE /categories/:id    delete category
```

### Products (admin: write, public: read)

```
GET    /products                        list products (pagination, filter, search)
GET    /products/:id                    get product by id
POST   /products                        create product (multipart or JSON)
PUT    /products/:id                    update product
DELETE /products/:id                    delete product
```

Query params for `GET /products`:

| Param        | Type   | Description                  |
| ------------ | ------ | ---------------------------- |
| `page`       | number | page number (default: 1)     |
| `limit`      | number | results per page (default: 10) |
| `categoryId` | number | filter by category           |
| `search`     | string | search by product name       |

### Orders (customer: own orders, admin: all)

```
POST   /orders              create order → sends confirmation email
GET    /orders/me           list my orders
GET    /orders/me/:id       get my order by id
GET    /orders              list all orders (admin, paginated)
PUT    /orders/:id/status   update status (admin)
```

Valid statuses: `PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED`

### Health

```
GET  /health   server status
```

## Examples

```bash
# register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Thym","email":"thym@example.com","password":"123456"}'

# login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"thym@example.com","password":"123456"}'

# create category (admin)
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Electronics"}'

# create product with image (admin)
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer <token>" \
  -F "name=iPhone 15" \
  -F "description=Latest iPhone" \
  -F "price=999.99" \
  -F "stock=50" \
  -F "categoryId=1" \
  -F "image=@/path/to/image.png"

# list products with filters
curl "http://localhost:3000/products?categoryId=1&search=iphone&page=1&limit=10"
```

## Project Structure

```
ecommerce-api/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── generated/
│   │   └── prisma/
│   ├── lib/
│   │   ├── mailer.ts
│   │   ├── prisma.ts
│   │   └── upload.ts
│   ├── middlewares/
│   │   ├── admin.middleware.ts
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── categories.ts
│   │   ├── orders.ts
│   │   ├── products.ts
│   │   └── users.ts
│   ├── schemas/
│   │   ├── category.schema.ts
│   │   ├── order.schema.ts
│   │   ├── product.schema.ts
│   │   └── user.schema.ts
│   ├── services/
│   │   ├── category.service.ts
│   │   ├── email.service.ts
│   │   ├── order.service.ts
│   │   ├── product.service.ts
│   │   └── user.service.ts
│   ├── index.ts
│   └── server.ts
├── uploads/
├── tests/
│   ├── auth.test.ts
│   ├── categories.test.ts
│   ├── orders.test.ts
│   └── products.test.ts
├── docker-compose.yml
└── .env
```

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.ts'
import prisma from '../src/lib/prisma.ts'
import bcrypt from 'bcryptjs'

let adminToken: string
let customerToken: string
let categoryId: number
let createdProductId: number

beforeAll(async () => {
  const hashed = await bcrypt.hash('adminpass', 10)

  // admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: `admin_prod_${Date.now()}@example.com`,
      password: hashed,
      role: 'ADMIN',
    },
  })

  // customer user
  const customer = await prisma.user.create({
    data: {
      name: 'Customer',
      email: `customer_prod_${Date.now()}@example.com`,
      password: hashed,
      role: 'CUSTOMER',
    },
  })

  // seed category for product creation
  const category = await prisma.category.create({ data: { name: `ProdTestCat_${Date.now()}` } })
  categoryId = category.id

  const [adminRes, customerRes] = await Promise.all([
    request(app).post('/auth/login').send({ email: admin.email, password: 'adminpass' }),
    request(app).post('/auth/login').send({ email: customer.email, password: 'adminpass' }),
  ])

  adminToken = adminRes.body.token
  customerToken = customerRes.body.token
})

afterAll(async () => {
  if (createdProductId) {
    await prisma.product.delete({ where: { id: createdProductId } }).catch(() => {})
  }
  await prisma.category.delete({ where: { id: categoryId } }).catch(() => {})
})

describe('GET /products', () => {
  test('returns paginated list (public)', async () => {
    const res = await request(app).get('/products')
    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(res.body.meta).toBeDefined()
  })
})

describe('GET /products/:id', () => {
  test('returns 404 for non-existent product', async () => {
    const res = await request(app).get('/products/99999')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('product not found')
  })
})

describe('POST /products', () => {
  test('blocks unauthenticated request', async () => {
    const res = await request(app).post('/products').send({ name: 'x', price: 1, stock: 1, categoryId })
    expect(res.status).toBe(401)
  })

  test('blocks customer (non-admin)', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'x', price: 1, stock: 1, categoryId })
    expect(res.status).toBe(403)
  })

  test('creates product as admin', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `TestProduct_${Date.now()}`, price: 9.99, stock: 50, categoryId })

    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    createdProductId = res.body.id
  })

  test('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'NoPrice' })

    expect(res.status).toBe(400)
  })
})

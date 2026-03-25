import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.ts'
import prisma from '../src/lib/prisma.ts'
import bcrypt from 'bcryptjs'

let customerToken: string
let adminToken: string
let productId: number
let categoryId: number
let createdOrderId: number

beforeAll(async () => {
  const hashed = await bcrypt.hash('testpass', 10)

  const [customer, admin] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'OrderCustomer',
        email: `order_cust_${Date.now()}@example.com`,
        password: hashed,
        role: 'CUSTOMER',
      },
    }),
    prisma.user.create({
      data: {
        name: 'OrderAdmin',
        email: `order_admin_${Date.now()}@example.com`,
        password: hashed,
        role: 'ADMIN',
      },
    }),
  ])

  // seed category + product
  const category = await prisma.category.create({ data: { name: `OrderCat_${Date.now()}` } })
  categoryId = category.id

  const product = await prisma.product.create({
    data: { name: 'Test Item', price: 10.0, stock: 100, categoryId },
  })
  productId = product.id

  const [custRes, adminRes] = await Promise.all([
    request(app).post('/auth/login').send({ email: customer.email, password: 'testpass' }),
    request(app).post('/auth/login').send({ email: admin.email, password: 'testpass' }),
  ])

  customerToken = custRes.body.token
  adminToken = adminRes.body.token
})

afterAll(async () => {
  if (createdOrderId) {
    await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } }).catch(() => {})
    await prisma.order.delete({ where: { id: createdOrderId } }).catch(() => {})
  }
  await prisma.product.delete({ where: { id: productId } }).catch(() => {})
  await prisma.category.delete({ where: { id: categoryId } }).catch(() => {})
})

describe('POST /orders', () => {
  test('blocks unauthenticated request', async () => {
    const res = await request(app)
      .post('/orders')
      .send({ items: [{ productId, quantity: 1 }] })
    expect(res.status).toBe(401)
  })

  test('rejects empty items array', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [] })
    expect(res.status).toBe(400)
  })

  test('creates order as customer', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ productId, quantity: 2 }] })

    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.total).toBe(20)
    expect(res.body.items).toHaveLength(1)
    createdOrderId = res.body.id
  })

  test('rejects non-existent product', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ productId: 99999, quantity: 1 }] })
    expect(res.status).toBe(404)
  })
})

describe('GET /orders/me', () => {
  test('blocks unauthenticated request', async () => {
    const res = await request(app).get('/orders/me')
    expect(res.status).toBe(401)
  })

  test('returns customer orders', async () => {
    const res = await request(app)
      .get('/orders/me')
      .set('Authorization', `Bearer ${customerToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('GET /orders/me/:id', () => {
  test('returns 404 for order not owned by user', async () => {
    const res = await request(app)
      .get('/orders/me/99999')
      .set('Authorization', `Bearer ${customerToken}`)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('order not found')
  })

  test('returns the order by id', async () => {
    const res = await request(app)
      .get(`/orders/me/${createdOrderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(createdOrderId)
  })
})

describe('GET /orders (admin)', () => {
  test('blocks non-admin customer', async () => {
    const res = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
    expect(res.status).toBe(403)
  })

  test('returns paginated orders for admin', async () => {
    const res = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(res.body.meta).toBeDefined()
  })
})

describe('PUT /orders/:id/status (admin)', () => {
  test('updates order status', async () => {
    const res = await request(app)
      .put(`/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SHIPPED' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('SHIPPED')
  })

  test('rejects invalid status', async () => {
    const res = await request(app)
      .put(`/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INVALID' })
    expect(res.status).toBe(400)
  })
})

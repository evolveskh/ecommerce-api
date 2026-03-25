import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.ts'
import prisma from '../src/lib/prisma.ts'
import bcrypt from 'bcryptjs'

let adminToken: string
let createdCategoryId: number

beforeAll(async () => {
  // create an admin user directly in DB
  const hashed = await bcrypt.hash('adminpass', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: `admin_cat_${Date.now()}@example.com`,
      password: hashed,
      role: 'ADMIN',
    },
  })

  const res = await request(app)
    .post('/auth/login')
    .send({ email: admin.email, password: 'adminpass' })

  adminToken = res.body.token
})

afterAll(async () => {
  if (createdCategoryId) {
    await prisma.category.delete({ where: { id: createdCategoryId } }).catch(() => {})
  }
})

describe('GET /categories', () => {
  test('returns array (public)', async () => {
    const res = await request(app).get('/categories')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('GET /categories/:id', () => {
  test('returns 404 for non-existent category', async () => {
    const res = await request(app).get('/categories/99999')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('category not found')
  })
})

describe('POST /categories', () => {
  test('blocks unauthenticated request', async () => {
    const res = await request(app).post('/categories').send({ name: 'Shoes' })
    expect(res.status).toBe(401)
  })

  test('creates category as admin', async () => {
    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `TestCategory_${Date.now()}` })

    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    createdCategoryId = res.body.id
  })

  test('rejects missing name', async () => {
    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.errors.name).toBeDefined()
  })
})

import { describe, test, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.ts'

const testUser = {
  name: 'Thym',
  email: `thym_${Date.now()}@example.com`, // unique email each run
  password: '123456',
}

let token: string

describe('POST /auth/register', () => {
  test('creates a new user', async () => {
    const res = await request(app).post('/auth/register').send(testUser)

    expect(res.status).toBe(201)
    expect(res.body.email).toBe(testUser.email)
    expect(res.body.password).toBeUndefined() // never exposed
  })

  test('rejects invalid email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Thym', email: 'notanemail', password: '123456' })

    expect(res.status).toBe(400)
    expect(res.body.errors.email).toBeDefined()
  })
})

describe('POST /auth/login', () => {
  test('returns token with valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()

    token = res.body.token // save for next tests
  })

  test('rejects wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('invalid credentials')
  })
})

describe('GET /users', () => {
  test('blocks request without token', async () => {
    const res = await request(app).get('/users')

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
  })

  test('returns users with valid token', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('GET /users/:id', () => {
  test('returns 404 for non-existent user', async () => {
    const res = await request(app)
      .get('/users/99999')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('user not found')
  })
})

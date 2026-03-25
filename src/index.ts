import express from 'express'
import usersRouter from './routes/users.ts'
import authRouter from './routes/auth.ts'
import categoriesRouter from './routes/categories.ts'
import productsRouter from './routes/products.ts'
import ordersRouter from './routes/orders.ts'

import { errorHandler } from './middlewares/error.middleware.ts'

export const app = express()

app.use(express.json())

app.use('/auth', authRouter)
app.use('/users', usersRouter)
app.use('/categories', categoriesRouter)
app.use('/products', productsRouter)
app.use('/orders', ordersRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(errorHandler)

import { transporter } from '../lib/mailer.ts'

interface OrderItem {
  quantity: number
  priceAtBuy: number
  product: { name: string }
}

interface Order {
  id: number
  total: number
  createdAt: Date
  items: OrderItem[]
}

export const EmailService = {
  async sendOrderConfirmation(userEmail: string, order: Order) {
    const itemLines = order.items
      .map(
        (i) =>
          `  • ${i.product.name} x${i.quantity} — $${(i.priceAtBuy * i.quantity).toFixed(2)}`,
      )
      .join('\n')

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: userEmail,
      subject: `Order #${order.id} confirmed`,
      text: [
        `Thanks for your order!`,
        ``,
        `Order #${order.id} — placed ${order.createdAt.toISOString()}`,
        ``,
        itemLines,
        ``,
        `Total: $${order.total.toFixed(2)}`,
      ].join('\n'),
    })
  },
}

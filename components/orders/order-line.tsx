'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Order } from '@/lib/types'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderLineProps {
  orders: Order[]
  selectedOrderId?: string
  onSelectOrder: (order: Order) => void
}

export function OrderLine({ orders, selectedOrderId, onSelectOrder }: OrderLineProps) {
  const activeOrders = orders.filter(
    (o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  )

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {activeOrders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          isSelected={selectedOrderId === order.id}
          onClick={() => onSelectOrder(order)}
        />
      ))}
      {activeOrders.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-8 text-muted-foreground">
          No active orders
        </div>
      )}
    </div>
  )
}

function OrderCard({
  order,
  isSelected,
  onClick,
}: {
  order: Order
  isSelected: boolean
  onClick: () => void
}) {
  const progress = order.progress || getProgressFromStatus(order.status)
  const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
  const formattedTime = new Date(order.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card
      className={cn(
        'p-4 min-w-[220px] cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-primary font-semibold text-sm">
          #{order.order_number}
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {order.table_label || `Table ${order.table_id?.slice(-2) || '-'}`}
        </span>
      </div>
      <p className="font-medium text-foreground">
        {order.customer_name || 'Walk-in Customer'}
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        {formattedDate}, {formattedTime}
      </p>
      <div className="flex items-center gap-2">
        <div className="relative">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium"
            style={{
              background: `conic-gradient(hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%)`,
            }}
          >
            <span className="bg-card h-6 w-6 rounded-full flex items-center justify-center">
              {progress}%
            </span>
          </div>
        </div>
        <span className="text-primary text-sm font-medium">On Progress</span>
        <span className="text-sm text-muted-foreground ml-auto flex items-center gap-1">
          {order.items.length} Items <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Card>
  )
}

function getProgressFromStatus(status: string): number {
  switch (status) {
    case 'pending':
      return 25
    case 'confirmed':
      return 50
    case 'preparing':
      return 75
    case 'ready':
      return 90
    case 'served':
    case 'completed':
      return 100
    default:
      return 0
  }
}

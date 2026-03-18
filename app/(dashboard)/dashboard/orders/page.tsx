'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/contexts/store-context'
import { api } from '@/lib/api'
import type { Order, OrderStatus } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  UtensilsCrossed,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: CheckCircle2 },
  preparing: { label: 'Preparing', color: 'bg-orange-500/10 text-orange-600 border-orange-200', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-500/10 text-green-600 border-green-200', icon: UtensilsCrossed },
  served: { label: 'Served', color: 'bg-teal-500/10 text-teal-600 border-teal-200', icon: ShoppingBag },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-600 border-red-200', icon: XCircle },
}

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'served']

export default function LiveOrdersPage() {
  const { currentStore } = useStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!currentStore) return
    try {
      const data = await api.getOrders(currentStore.id)
      setOrders(data)
      setLastRefreshed(new Date())
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentStore])

  useEffect(() => {
    setIsLoading(true)
    fetchOrders()
    const interval = setInterval(fetchOrders, 15000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
  const displayOrders = filterStatus
    ? orders.filter((o) => o.status === filterStatus)
    : activeOrders

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a store to monitor orders</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold">Live Orders</h1>
          <p className="text-sm text-muted-foreground">
            Auto-refreshes every 15s · Last updated {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" onClick={() => { setIsLoading(true); fetchOrders() }}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Status Filter Bar */}
      <div className="flex gap-2 flex-wrap shrink-0">
        <Button
          variant={filterStatus === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus(null)}
        >
          Active ({activeOrders.length})
        </Button>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(filterStatus === status ? null : status)}
          >
            <config.icon className="h-3.5 w-3.5 mr-1.5" />
            {config.label} ({statusCounts[status] || 0})
          </Button>
        ))}
      </div>

      {/* Orders Grid */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No orders found</p>
            <p className="text-sm">
              {filterStatus ? `No ${filterStatus} orders right now` : 'No active orders at the moment'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {displayOrders.map((order) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const StatusIcon = config.icon
              return (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: 'currentColor' }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          #{order.order_number || order.id.slice(0, 8)}
                        </CardTitle>
                        <Badge variant="outline" className={cn('text-xs', config.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {order.order_type.replace('_', ' ')}
                        </span>
                        {order.table_number && (
                          <Badge variant="secondary" className="text-xs">
                            Table {order.table_number}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="font-semibold text-primary">
                          ₹{(order.net_amount || order.total || 0).toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

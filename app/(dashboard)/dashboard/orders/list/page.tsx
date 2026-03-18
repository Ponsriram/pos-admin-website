'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  MoreHorizontal,
  ArrowUpDown,
  ExternalLink,
  CalendarIcon,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Order, OrderStatus, OrderType } from '@/lib/types'
import { useStore } from '@/contexts/store-context'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const statusOptions: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'served', label: 'Served' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const typeOptions: { value: OrderType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'dine_in', label: 'Dine In' },
  { value: 'takeaway', label: 'Take Away' },
  { value: 'delivery', label: 'Delivery' },
]

export default function OrdersListPage() {
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get('store_id')
  const { currentStore } = useStore()
  const storeId = storeIdParam || currentStore?.id

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<OrderType | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([])

  useEffect(() => {
    if (storeId) loadOrders()
  }, [storeId, statusFilter])

  const loadOrders = async () => {
    if (!storeId) return
    setIsLoading(true)
    try {
      const status = statusFilter !== 'all' ? statusFilter : undefined
      const data = await api.getOrders(storeId, status)
      setOrders(data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    if (!storeId) return
    try {
      await api.updateOrderStatus(storeId, orderId, status)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      )
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const handleBulkUpdateStatus = async (status: OrderStatus) => {
    if (!storeId) return
    const ids = selectedOrders.map((o) => o.id)
    try {
      await api.bulkUpdateOrders(storeId, ids, status)
    } catch (error) {
      console.error('Failed to bulk update orders:', error)
    }
    setOrders((prev) =>
      prev.map((o) => (ids.includes(o.id) ? { ...o, status } : o))
    )
    setSelectedOrders([])
  }

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a store to view orders</p>
      </div>
    )
  }

  // Apply filters
  const filteredOrders = orders.filter((order) => {
    if (typeFilter !== 'all' && order.order_type !== typeFilter) return false
    if (dateFilter) {
      const orderDate = new Date(order.created_at).toDateString()
      if (orderDate !== dateFilter.toDateString()) return false
    }
    return true
  })

  // Stats — use net_amount with fallback to total
  const totalRevenue = filteredOrders
    .filter((o) => o.payment_status === 'completed' || o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.net_amount || o.total || 0), 0)
  const totalOrders = filteredOrders.length
  const pendingOrders = filteredOrders.filter((o) => o.status === 'pending').length
  const completedOrders = filteredOrders.filter((o) => o.status === 'completed').length

  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600',
      confirmed: 'bg-blue-500/10 text-blue-600',
      preparing: 'bg-orange-500/10 text-orange-600',
      ready: 'bg-green-500/10 text-green-600',
      served: 'bg-teal-500/10 text-teal-600',
      completed: 'bg-emerald-500/10 text-emerald-600',
      cancelled: 'bg-red-500/10 text-red-600',
    }
    return (
      <Badge variant="outline" className={cn('capitalize', styles[status])}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      dine_in: 'bg-primary/10 text-primary',
      takeaway: 'bg-purple-500/10 text-purple-600',
      take_away: 'bg-purple-500/10 text-purple-600',
      delivery: 'bg-indigo-500/10 text-indigo-600',
    }
    const labels: Record<string, string> = {
      dine_in: 'Dine In',
      takeaway: 'Take Away',
      take_away: 'Take Away',
      delivery: 'Delivery',
    }
    return (
      <Badge variant="outline" className={cn('capitalize', styles[type] || '')}>
        {labels[type] || type}
      </Badge>
    )
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'order_number',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Order #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-primary font-medium">
          #{row.getValue('order_number')}
        </span>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => {
        const order = row.original
        return (
          <div>
            <div className="font-medium">{order.customer_name || 'Walk-in'}</div>
            {order.table_label && (
              <div className="text-sm text-muted-foreground">{order.table_label}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'order_type',
      header: 'Type',
      cell: ({ row }) => getTypeBadge(row.getValue('order_type')),
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => {
        const items = row.original.items || []
        return (
          <span className="text-muted-foreground">
            {items.reduce((sum, i) => sum + i.quantity, 0)} items
          </span>
        )
      },
    },
    {
      accessorKey: 'net_amount',
      header: 'Total',
      cell: ({ row }) => {
        const order = row.original
        const amount = order.net_amount || order.total || 0
        return (
          <span className="font-medium">
            ${amount.toFixed(2)}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.getValue('status')),
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment',
      cell: ({ row }) => {
        const status = row.original.payment_status
        const isPaid = status === 'completed' || status === 'paid'
        return (
          <Badge
            variant={isPaid ? 'default' : 'secondary'}
            className={isPaid ? 'bg-green-500/10 text-green-600' : ''}
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          <div>{format(new Date(row.getValue('created_at')), 'MMM d, yyyy')}</div>
          <div className="text-xs">{format(new Date(row.getValue('created_at')), 'h:mm a')}</div>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/orders/${order.id}`}>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmed')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'preparing')}>
                  <Clock className="h-4 w-4 mr-2" />
                  Start Preparing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'ready')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Ready
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'completed')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Printer className="h-4 w-4 mr-2" />
                  Print KOT
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-muted-foreground">Manage and track all orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadOrders}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as OrderType | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {dateFilter && (
          <Button variant="ghost" size="sm" onClick={() => setDateFilter(undefined)}>
            Clear date
          </Button>
        )}

        {selectedOrders.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">
              {selectedOrders.length} selected
            </span>
            <Button variant="outline" size="sm" onClick={() => handleBulkUpdateStatus('confirmed')}>
              Confirm All
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkUpdateStatus('completed')}>
              Complete All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => handleBulkUpdateStatus('cancelled')}
            >
              Cancel All
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        searchKey="order_number"
        searchPlaceholder="Search by order #..."
        isLoading={isLoading}
        enableSelection
        onRowSelectionChange={setSelectedOrders}
      />
    </div>
  )
}

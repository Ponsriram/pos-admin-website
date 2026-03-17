'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Clock,
  User,
  Phone,
  MapPin,
  CreditCard,
  Printer,
  CheckCircle,
  XCircle,
  DollarSign,
  Receipt,
  Utensils,
  Truck,
  ShoppingBag,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Order, OrderStatus, OrderTimelineEvent, Payment, PaymentMethod, KOT } from '@/lib/types'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

const demoOrder: Order = {
  id: '1',
  order_number: '231128421',
  store_id: '1',
  table_id: 't3',
  table_label: 'Table 03',
  customer_name: 'Budianto Siregar',
  customer_phone: '+1 555-1234',
  order_type: 'dine_in',
  status: 'preparing',
  items: [
    { id: '1', order_id: '1', menu_item_id: '1', menu_item_name: 'Grilled Lobster', quantity: 1, unit_price: 32, add_ons: [{ name: 'Extra butter', price: 2 }], subtotal: 34 },
    { id: '2', order_id: '1', menu_item_id: '2', menu_item_name: 'Beef Wellington', quantity: 2, unit_price: 26.30, subtotal: 52.60 },
    { id: '3', order_id: '1', menu_item_id: '6', menu_item_name: 'Wagyu Steak', quantity: 1, unit_price: 27.50, add_ons: [{ name: 'Garlic Butter', price: 1.50 }, { name: 'Truffle Sauce', price: 2.00 }], subtotal: 31 },
  ],
  subtotal: 117.60,
  tax: 8.47,
  discount: 10,
  total: 116.07,
  payment_status: 'pending',
  created_at: '2025-10-05T11:32:00Z',
  updated_at: '2025-10-05T12:15:00Z',
  progress: 60,
}

const demoTimeline: OrderTimelineEvent[] = [
  { id: '1', order_id: '1', event_type: 'created', description: 'Order placed by customer', created_at: '2025-10-05T11:32:00Z', created_by: 'Sarah (Waiter)' },
  { id: '2', order_id: '1', event_type: 'confirmed', description: 'Order confirmed by kitchen', created_at: '2025-10-05T11:35:00Z', created_by: 'Mike (Kitchen)' },
  { id: '3', order_id: '1', event_type: 'preparing', description: 'Order is being prepared', created_at: '2025-10-05T11:40:00Z', created_by: 'Kitchen' },
]

const demoPayments: Payment[] = []

const demoKOT: KOT = {
  id: 'kot1',
  order_id: '1',
  store_id: '1',
  items: [
    { menu_item_name: 'Grilled Lobster', quantity: 1, notes: 'Extra butter' },
    { menu_item_name: 'Beef Wellington', quantity: 2 },
    { menu_item_name: 'Wagyu Steak', quantity: 1, notes: 'Medium rare' },
  ],
  status: 'preparing',
  created_at: '2025-10-05T11:32:00Z',
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [timeline, setTimeline] = useState<OrderTimelineEvent[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [kot, setKot] = useState<KOT | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'card' as PaymentMethod,
  })

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const storeId = '1' // Would get from context
      const [orderData, timelineData, paymentsData] = await Promise.all([
        api.getOrder(storeId, id),
        api.getOrderTimeline(storeId, id),
        api.getOrderPayments(storeId, id),
      ])
      setOrder(orderData)
      setTimeline(timelineData)
      setPayments(paymentsData)
    } catch {
      setOrder(demoOrder)
      setTimeline(demoTimeline)
      setPayments(demoPayments)
      setKot(demoKOT)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (status: OrderStatus) => {
    if (!order) return
    try {
      await api.updateOrderStatus(order.store_id, order.id, status)
      setOrder((prev) => (prev ? { ...prev, status } : prev))
      // Add to timeline
      setTimeline((prev) => [
        ...prev,
        {
          id: String(prev.length + 1),
          order_id: order.id,
          event_type: status,
          description: `Order status changed to ${status}`,
          created_at: new Date().toISOString(),
        },
      ])
    } catch {
      setOrder((prev) => (prev ? { ...prev, status } : prev))
      setTimeline((prev) => [
        ...prev,
        {
          id: String(prev.length + 1),
          order_id: order.id,
          event_type: status,
          description: `Order status changed to ${status}`,
          created_at: new Date().toISOString(),
        },
      ])
    }
  }

  const handleAddPayment = async () => {
    if (!order || !paymentForm.amount) return
    setIsSubmitting(true)
    try {
      const payment = await api.createPayment(order.store_id, order.id, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
      })
      setPayments((prev) => [...prev, payment])
      const totalPaid = [...payments, payment].reduce((sum, p) => sum + p.amount, 0)
      if (totalPaid >= order.total) {
        setOrder((prev) => (prev ? { ...prev, payment_status: 'paid' } : prev))
      }
      setIsPaymentDialogOpen(false)
      setPaymentForm({ amount: '', method: 'card' })
    } catch {
      const fakePayment: Payment = {
        id: String(payments.length + 1),
        order_id: order.id,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        status: 'paid',
        created_at: new Date().toISOString(),
      }
      setPayments((prev) => [...prev, fakePayment])
      const totalPaid = [...payments, fakePayment].reduce((sum, p) => sum + p.amount, 0)
      if (totalPaid >= order.total) {
        setOrder((prev) => (prev ? { ...prev, payment_status: 'paid' } : prev))
      }
      setIsPaymentDialogOpen(false)
      setPaymentForm({ amount: '', method: 'card' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrintKOT = () => {
    // In a real app, this would trigger the KOT print
    window.print()
  }

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      ready: 'bg-green-500',
      served: 'bg-teal-500',
      completed: 'bg-emerald-500',
      cancelled: 'bg-red-500',
    }
    return colors[status]
  }

  const getOrderTypeIcon = (type: Order['order_type']) => {
    switch (type) {
      case 'dine_in':
        return <Utensils className="h-4 w-4" />
      case 'take_away':
        return <ShoppingBag className="h-4 w-4" />
      case 'delivery':
        return <Truck className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Link href="/dashboard/orders/list">
          <Button variant="link">Back to Orders</Button>
        </Link>
      </div>
    )
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remainingAmount = order.total - totalPaid

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders/list">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Order #{order.order_number}</h1>
              <Badge
                variant="outline"
                className={cn(
                  'capitalize',
                  order.status === 'completed' && 'bg-emerald-500/10 text-emerald-600',
                  order.status === 'cancelled' && 'bg-red-500/10 text-red-600',
                  order.status === 'preparing' && 'bg-orange-500/10 text-orange-600',
                  order.status === 'ready' && 'bg-green-500/10 text-green-600',
                  order.status === 'pending' && 'bg-yellow-500/10 text-yellow-600'
                )}
              >
                {order.status}
              </Badge>
              <Badge
                variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                className={order.payment_status === 'paid' ? 'bg-green-500 text-white' : ''}
              >
                {order.payment_status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(order.created_at), 'PPp')}
              </span>
              <span className="flex items-center gap-1">
                {getOrderTypeIcon(order.order_type)}
                {order.order_type.replace('_', ' ')}
              </span>
              {order.table_label && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {order.table_label}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrintKOT}>
            <Printer className="h-4 w-4 mr-2" />
            Print KOT
          </Button>
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <>
              {order.status === 'pending' && (
                <Button onClick={() => handleUpdateStatus('confirmed')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
              )}
              {order.status === 'confirmed' && (
                <Button onClick={() => handleUpdateStatus('preparing')}>
                  Start Preparing
                </Button>
              )}
              {order.status === 'preparing' && (
                <Button onClick={() => handleUpdateStatus('ready')}>
                  Mark Ready
                </Button>
              )}
              {order.status === 'ready' && (
                <Button onClick={() => handleUpdateStatus('served')}>
                  Mark Served
                </Button>
              )}
              {order.status === 'served' && (
                <Button onClick={() => handleUpdateStatus('completed')}>
                  Complete Order
                </Button>
              )}
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => handleUpdateStatus('cancelled')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{order.customer_name || 'Walk-in Customer'}</p>
                </div>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{order.customer_phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Items</CardTitle>
              <CardDescription>{order.items.length} items in this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.menu_item_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          x{item.quantity}
                        </Badge>
                      </div>
                      {item.add_ons && item.add_ons.length > 0 && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          Add-ons:{' '}
                          {item.add_ons.map((a, i) => (
                            <span key={i}>
                              {a.name} (+${a.price.toFixed(2)})
                              {i < item.add_ons!.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>+${order.tax.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-6">
                {timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={cn(
                          'h-3 w-3 rounded-full',
                          getStatusColor(event.event_type as OrderStatus)
                        )}
                      />
                      {index < timeline.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="font-medium capitalize">{event.event_type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(event.created_at), 'PPp')}
                        {event.created_by && ` - ${event.created_by}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">${order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-green-600">${totalPaid.toFixed(2)}</span>
                </div>
                {remainingAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium text-orange-600">
                      ${remainingAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {payments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Payment History</p>
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{payment.method}</span>
                        </div>
                        <span>${payment.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {order.payment_status !== 'paid' && (
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Payment</DialogTitle>
                      <DialogDescription>
                        Record a payment for this order. Remaining: ${remainingAmount.toFixed(2)}
                      </DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Amount</FieldLabel>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Payment Method</FieldLabel>
                        <Select
                          value={paymentForm.method}
                          onValueChange={(value) =>
                            setPaymentForm({ ...paymentForm, method: value as PaymentMethod })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddPayment} disabled={!paymentForm.amount || isSubmitting}>
                        {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                        Add Payment
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* KOT Preview */}
          {kot && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Kitchen Order Ticket</CardTitle>
                <Button variant="outline" size="sm" onClick={handlePrintKOT}>
                  <Printer className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-muted/50 font-mono text-sm">
                  <div className="text-center mb-4">
                    <p className="font-bold">KOT #{kot.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(kot.created_at), 'PPp')}
                    </p>
                  </div>
                  <Separator className="my-2" />
                  <div className="space-y-2">
                    {kot.items.map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between">
                          <span>{item.quantity}x {item.menu_item_name}</span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground ml-4">Note: {item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  <div className="text-center text-xs text-muted-foreground">
                    {order.table_label || 'Take Away'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Printer className="h-4 w-4 mr-2" />
                Reprint KOT
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

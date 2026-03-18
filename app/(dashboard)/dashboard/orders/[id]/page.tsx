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
  IndianRupee,
  Receipt,
  Utensils,
  Truck,
  ShoppingBag,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Order, OrderStatus, OrderTimelineEvent, Payment, PaymentMethod, KOT } from '@/lib/types'
import { useStore } from '@/contexts/store-context'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { currentStore } = useStore()
  const storeId = currentStore?.id
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
    if (storeId) loadData()
  }, [id, storeId])

  const loadData = async () => {
    if (!storeId) return
    setIsLoading(true)
    try {
      const [orderData, timelineData, paymentsData] = await Promise.all([
        api.getOrder(storeId, id),
        api.getOrderTimeline(storeId, id).catch(() => [] as OrderTimelineEvent[]),
        api.getOrderPayments(storeId, id).catch(() => [] as Payment[]),
      ])
      setOrder(orderData)
      setTimeline(timelineData)
      setPayments(paymentsData)
    } catch (error) {
      console.error('Failed to load order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (status: OrderStatus) => {
    if (!order || !storeId) return
    try {
      await api.updateOrderStatus(storeId, order.id, status)
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
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const handleAddPayment = async () => {
    if (!order || !paymentForm.amount || !storeId) return
    setIsSubmitting(true)
    try {
      const payment = await api.createPayment(storeId, order.id, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
      })
      setPayments((prev) => [...prev, payment])
      const orderTotal = order.net_amount || order.total || 0
      const totalPaid = [...payments, payment].reduce((sum, p) => sum + p.amount, 0)
      if (totalPaid >= orderTotal) {
        setOrder((prev) => (prev ? { ...prev, payment_status: 'completed' } : prev))
      }
      setIsPaymentDialogOpen(false)
      setPaymentForm({ amount: '', method: 'card' })
    } catch (error) {
      console.error('Failed to add payment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrintKOT = () => {
    window.print()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      ready: 'bg-green-500',
      served: 'bg-teal-500',
      completed: 'bg-emerald-500',
      cancelled: 'bg-red-500',
      created: 'bg-gray-500',
      payment_received: 'bg-green-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in':
        return <Utensils className="h-4 w-4" />
      case 'takeaway':
      case 'take_away':
        return <ShoppingBag className="h-4 w-4" />
      case 'delivery':
        return <Truck className="h-4 w-4" />
      default:
        return <ShoppingBag className="h-4 w-4" />
    }
  }

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a store to view order details</p>
      </div>
    )
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

  // Use backend fields with fallback to frontend aliases
  const orderTotal = order.net_amount || order.total || 0
  const orderSubtotal = order.gross_amount || order.subtotal || 0
  const orderTax = order.tax_amount || order.tax || 0
  const orderDiscount = order.discount_amount || order.discount || 0

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remainingAmount = orderTotal - totalPaid

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
                variant={order.payment_status === 'completed' || order.payment_status === 'paid' ? 'default' : 'secondary'}
                className={order.payment_status === 'completed' || order.payment_status === 'paid' ? 'bg-green-500 text-white' : ''}
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
                {order.items.map((item) => {
                  const itemName = item.product_name || item.menu_item_name || 'Unknown Item'
                  const itemPrice = item.price || item.unit_price || 0
                  const itemTotal = item.total || item.subtotal || (itemPrice * item.quantity)
                  return (
                    <div key={item.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{itemName}</span>
                          <Badge variant="secondary" className="text-xs">
                            x{item.quantity}
                          </Badge>
                        </div>
                        {item.add_ons && item.add_ons.length > 0 && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            Add-ons:{' '}
                            {item.add_ons.map((a, i) => (
                              <span key={i}>
                                {a.name} (+₹{a.price.toFixed(2)})
                                {i < item.add_ons!.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-medium">₹{itemTotal.toFixed(2)}</span>
                    </div>
                  )
                })}
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{orderSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>+₹{orderTax.toFixed(2)}</span>
                  </div>
                  {orderDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{orderDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">₹{orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {timeline.length > 0 && (
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
                            getStatusColor(event.event_type)
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
          )}
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
                  <span className="font-medium">₹{orderTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-green-600">₹{totalPaid.toFixed(2)}</span>
                </div>
                {remainingAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium text-orange-600">
                      ₹{remainingAmount.toFixed(2)}
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
                          <span className="capitalize">{payment.payment_method || payment.method}</span>
                        </div>
                        <span>₹{payment.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {order.payment_status !== 'completed' && order.payment_status !== 'paid' && (
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <IndianRupee className="h-4 w-4 mr-2" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Payment</DialogTitle>
                      <DialogDescription>
                        Record a payment for this order. Remaining: ₹{remainingAmount.toFixed(2)}
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

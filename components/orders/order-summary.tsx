'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MoreHorizontal, CreditCard, X } from 'lucide-react'
import type { MenuItem, TableLabel, OrderType, PaymentMethod } from '@/lib/types'

interface CartItem {
  menuItem: MenuItem
  quantity: number
  addOns: { name: string; price: number }[]
}

interface OrderSummaryProps {
  cartItems: CartItem[]
  tables: TableLabel[]
  customerName: string
  selectedTable: string
  orderType: OrderType
  onUpdateCustomerName: (name: string) => void
  onSelectTable: (tableId: string) => void
  onUpdateOrderType: (type: OrderType) => void
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onClearAll: () => void
  onConfirmPayment: (paymentMethod: PaymentMethod) => void
  isProcessing: boolean
}

export function OrderSummary({
  cartItems,
  tables,
  customerName,
  selectedTable,
  orderType,
  onUpdateCustomerName,
  onSelectTable,
  onUpdateOrderType,
  onUpdateQuantity,
  onRemoveItem,
  onClearAll,
  onConfirmPayment,
  isProcessing,
}: OrderSummaryProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [promoCode, setPromoCode] = useState('')

  const subtotal = cartItems.reduce((sum, item) => {
    const itemTotal = item.menuItem.price * item.quantity
    const addOnsTotal = item.addOns.reduce((a, addon) => a + addon.price, 0) * item.quantity
    return sum + itemTotal + addOnsTotal
  }, 0)

  const taxRate = 0.072 // 7.2% tax
  const taxes = subtotal * taxRate
  const discount = promoCode ? subtotal * 0.1 : 0 // 10% discount if promo code applied
  const grandTotal = subtotal + taxes - discount

  const orderNumber = `#${Date.now().toString().slice(-8)}`

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Order Summary</CardTitle>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Order type tabs */}
        <Tabs
          value={orderType}
          onValueChange={(v) => onUpdateOrderType(v as OrderType)}
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="dine_in">Dine In</TabsTrigger>
            <TabsTrigger value="take_away">Take Away</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Customer info */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="customerName" className="text-xs text-muted-foreground">
              Customer Name
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => onUpdateCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Order ID</Label>
              <Input value={orderNumber} disabled className="mt-1 text-primary" />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Table</Label>
              <Select value={selectedTable} onValueChange={onSelectTable}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.table_number} value={String(table.table_number)}>
                      {table.table_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Order items header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Order Items</h3>
          <Button
            variant="link"
            size="sm"
            className="text-primary p-0 h-auto"
            onClick={onClearAll}
          >
            Clear all items
          </Button>
        </div>

        {/* Order items list */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {cartItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No items in cart
            </div>
          ) : (
            cartItems.map((item) => (
              <CartItemRow
                key={item.menuItem.id}
                item={item}
                onUpdateQuantity={(qty) => onUpdateQuantity(item.menuItem.id, qty)}
                onRemove={() => onRemoveItem(item.menuItem.id)}
              />
            ))
          )}
        </div>

        {/* Totals */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxes</span>
            <span>+${taxes.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-green-600">-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-2">
            <span>Grand Total</span>
            <span className="text-primary">${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <Label className="text-xs text-muted-foreground">Payment Method</Label>
          <Select
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
          >
            <SelectTrigger className="mt-1">
              <CreditCard className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">Credit or Debit Card</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Promo code */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter Promo Code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
          <Button variant="outline">Apply</Button>
        </div>

        {/* Confirm payment button */}
        <Button
          size="lg"
          className="w-full"
          onClick={() => onConfirmPayment(paymentMethod)}
          disabled={cartItems.length === 0 || isProcessing}
        >
          <CreditCard className="h-5 w-5 mr-2" />
          {isProcessing ? 'Processing...' : 'Confirm Payment'}
        </Button>
      </CardContent>
    </Card>
  )
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem
  onUpdateQuantity: (qty: number) => void
  onRemove: () => void
}) {
  const itemTotal =
    (item.menuItem.price + item.addOns.reduce((a, addon) => a + addon.price, 0)) *
    item.quantity
  const imageUrl = item.menuItem.image_url || `/api/placeholder/60/60?text=${encodeURIComponent(item.menuItem.name.slice(0, 1))}`

  return (
    <div className="flex gap-3 p-2 rounded-lg bg-muted/50">
      <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
        <Image
          src={imageUrl}
          alt={item.menuItem.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-sm">{item.menuItem.name}</h4>
            {item.addOns.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Add-ons:
                <ul className="list-disc list-inside">
                  {item.addOns.map((addon, i) => (
                    <li key={i}>
                      {addon.name} (+${addon.price.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">x{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">Subtotal:</span>
          <span className="text-primary font-semibold text-sm">
            ${itemTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}

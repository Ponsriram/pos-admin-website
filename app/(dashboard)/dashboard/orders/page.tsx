'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/contexts/store-context'
import { api } from '@/lib/api'
import type { Order, MenuItem, Category, OrderType, PaymentMethod } from '@/lib/types'
import { OrderLine } from '@/components/orders/order-line'
import { MenuGrid } from '@/components/orders/menu-grid'
import { OrderSummary } from '@/components/orders/order-summary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreHorizontal, RefreshCw } from 'lucide-react'

interface CartItem {
  menuItem: MenuItem
  quantity: number
  addOns: { name: string; price: number }[]
}

export default function OrdersPage() {
  const { currentStore, tables: storeTables } = useStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('dine_in')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      if (currentStore) {
        const [ordersData, menuData, categoriesData] = await Promise.all([
          api.getOrders(currentStore.id),
          api.getMenuItems(currentStore.id),
          api.getCategories(currentStore.id).catch(() => [] as Category[]),
        ])
        setOrders(ordersData)
        setMenuItems(menuData)
        setCategories(categoriesData)
      } else {
        setOrders([])
        setMenuItems([])
        setCategories([])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setOrders([])
      setMenuItems([])
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [currentStore])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleAddItem = (item: MenuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id)
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        )
      }
      return [...prev, { menuItem: item, quantity: 1, addOns: [] }]
    })
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId)
      return
    }
    setCartItems((prev) =>
      prev.map((ci) =>
        ci.menuItem.id === itemId ? { ...ci, quantity } : ci
      )
    )
  }

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.menuItem.id !== itemId))
  }

  const handleClearAll = () => {
    setCartItems([])
  }

  const handleConfirmPayment = async (paymentMethod: PaymentMethod) => {
    if (cartItems.length === 0 || !currentStore) return
    setIsProcessing(true)
    try {
      await api.createOrder({
        store_id: currentStore.id,
        table_number: selectedTable ? parseInt(selectedTable) : undefined,
        order_type: orderType,
        items: cartItems.map((ci) => ({
          product_id: ci.menuItem.id,
          quantity: ci.quantity,
          price: ci.menuItem.price,
        })),
      })
      // Clear cart and refresh
      setCartItems([])
      setCustomerName('')
      setSelectedTable('')
      fetchData()
    } catch (error) {
      console.error('Failed to create order:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const cartItemIds = new Set(cartItems.map((ci) => ci.menuItem.id))

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a store to manage orders</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Order Line */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-lg">Order Line</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchData}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoading ? (
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-[220px]" />
              ))}
            </div>
          ) : (
            <OrderLine
              orders={orders}
              selectedOrderId={selectedOrder?.id}
              onSelectOrder={setSelectedOrder}
            />
          )}
        </CardContent>
      </Card>

      {/* Main content area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <MenuGrid
              items={menuItems}
              categories={categories}
              onAddItem={handleAddItem}
              cartItemIds={cartItemIds}
            />
          )}
        </div>

        {/* Order Summary */}
        <div className="w-[360px] shrink-0">
          <OrderSummary
            cartItems={cartItems}
            tables={storeTables}
            customerName={customerName}
            selectedTable={selectedTable}
            orderType={orderType}
            onUpdateCustomerName={setCustomerName}
            onSelectTable={setSelectedTable}
            onUpdateOrderType={setOrderType}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearAll={handleClearAll}
            onConfirmPayment={handleConfirmPayment}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  )
}

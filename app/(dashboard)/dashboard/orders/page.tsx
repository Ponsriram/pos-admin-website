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

// Demo data for preview when API is not available
const demoCategories: Category[] = [
  { id: '1', store_id: '1', name: 'Appetizer', sort_order: 1 },
  { id: '2', store_id: '1', name: 'Main Course', sort_order: 2 },
  { id: '3', store_id: '1', name: 'Noodles & Rice', sort_order: 3 },
  { id: '4', store_id: '1', name: 'Dessert', sort_order: 4 },
  { id: '5', store_id: '1', name: 'Vegetarian', sort_order: 5 },
]

const demoMenuItems: MenuItem[] = [
  { id: '1', store_id: '1', category_id: '1', name: 'Grilled Lobster', description: 'Delicious baked lobster', price: 32.00, image_url: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=300&h=200&fit=crop', is_available: true },
  { id: '2', store_id: '1', category_id: '2', name: 'Beef Welli', description: 'Tender beef in pastry', price: 26.30, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop', is_available: true },
  { id: '3', store_id: '1', category_id: '2', name: 'Scallops Sauce', description: 'Seared scallops with sauce', price: 25.30, image_url: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=300&h=200&fit=crop', is_available: true },
  { id: '4', store_id: '1', category_id: '1', name: 'Sea Urchin', description: 'Fresh sea urchin served', price: 19.00, image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop', is_available: true },
  { id: '5', store_id: '1', category_id: '2', name: 'Peking Chicken', description: 'Crispy roasted chicken', price: 18.00, image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&h=200&fit=crop', is_available: true },
  { id: '6', store_id: '1', category_id: '2', name: 'Wagyu Steak', description: 'Juicy premium wagyu beef', price: 27.50, image_url: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=300&h=200&fit=crop', is_available: true },
  { id: '7', store_id: '1', category_id: '3', name: 'Cod Miso', description: 'Grilled black cod with miso', price: 23.20, image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&h=200&fit=crop', is_available: true },
  { id: '8', store_id: '1', category_id: '2', name: 'Duck Orange', description: 'Classic roasted duck dish', price: 21.50, image_url: 'https://images.unsplash.com/photo-1580554530778-ca36943f5a69?w=300&h=200&fit=crop', is_available: true },
]

const demoOrders: Order[] = [
  {
    id: '1',
    order_number: '231128421',
    store_id: '1',
    table_label: 'Table 03',
    customer_name: 'Budianto Siregar',
    order_type: 'dine_in',
    status: 'preparing',
    items: [
      { id: '1', order_id: '1', menu_item_id: '1', menu_item_name: 'Grilled Lobster', quantity: 1, unit_price: 32, subtotal: 32 },
      { id: '2', order_id: '1', menu_item_id: '2', menu_item_name: 'Beef Welli', quantity: 2, unit_price: 26.30, subtotal: 52.60 },
    ],
    subtotal: 84.60,
    tax: 6.09,
    discount: 0,
    total: 90.69,
    payment_status: 'pending',
    created_at: '2025-10-05T11:32:00Z',
    updated_at: '2025-10-05T11:32:00Z',
    progress: 60,
  },
  {
    id: '2',
    order_number: '231128422',
    store_id: '1',
    table_label: 'Table 08',
    customer_name: 'Theresa Webb',
    order_type: 'dine_in',
    status: 'preparing',
    items: [
      { id: '3', order_id: '2', menu_item_id: '3', menu_item_name: 'Scallops Sauce', quantity: 1, unit_price: 25.30, subtotal: 25.30 },
      { id: '4', order_id: '2', menu_item_id: '4', menu_item_name: 'Sea Urchin', quantity: 2, unit_price: 19, subtotal: 38 },
    ],
    subtotal: 63.30,
    tax: 4.56,
    discount: 0,
    total: 67.86,
    payment_status: 'pending',
    created_at: '2025-10-05T11:42:00Z',
    updated_at: '2025-10-05T11:42:00Z',
    progress: 73,
  },
  {
    id: '3',
    order_number: '231128423',
    store_id: '1',
    table_label: 'Table 10',
    customer_name: 'Jerome Bell',
    order_type: 'dine_in',
    status: 'confirmed',
    items: [
      { id: '5', order_id: '3', menu_item_id: '6', menu_item_name: 'Wagyu Steak', quantity: 1, unit_price: 27.50, subtotal: 27.50 },
      { id: '6', order_id: '3', menu_item_id: '7', menu_item_name: 'Cod Miso', quantity: 1, unit_price: 23.20, subtotal: 23.20 },
    ],
    subtotal: 50.70,
    tax: 3.65,
    discount: 0,
    total: 54.35,
    payment_status: 'pending',
    created_at: '2025-10-05T11:48:00Z',
    updated_at: '2025-10-05T11:48:00Z',
    progress: 82,
  },
]

const demoTables = [
  { id: 't1', store_id: '1', label: 'Table 01', capacity: 4, status: 'available' as const },
  { id: 't2', store_id: '1', label: 'Table 02', capacity: 4, status: 'available' as const },
  { id: 't3', store_id: '1', label: 'Table 03', capacity: 6, status: 'occupied' as const },
  { id: 't8', store_id: '1', label: 'Table 08', capacity: 4, status: 'occupied' as const },
  { id: 't10', store_id: '1', label: 'Table 10', capacity: 2, status: 'occupied' as const },
  { id: 't18', store_id: '1', label: 'Table 18', capacity: 8, status: 'available' as const },
]

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
  const [customerName, setCustomerName] = useState('Brooklyn Simmons')
  const [selectedTable, setSelectedTable] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('dine_in')

  const tables = storeTables.length > 0 ? storeTables : demoTables

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      if (currentStore) {
        const [ordersData, menuData, categoriesData] = await Promise.all([
          api.getOrders(currentStore.id),
          api.getMenuItems(currentStore.id),
          api.getCategories(currentStore.id),
        ])
        setOrders(ordersData)
        setMenuItems(menuData)
        setCategories(categoriesData)
      } else {
        // Use demo data when no store is selected
        setOrders(demoOrders)
        setMenuItems(demoMenuItems)
        setCategories(demoCategories)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      // Fallback to demo data on error
      setOrders(demoOrders)
      setMenuItems(demoMenuItems)
      setCategories(demoCategories)
    } finally {
      setIsLoading(false)
    }
  }, [currentStore])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Pre-populate cart with demo items
  useEffect(() => {
    if (menuItems.length > 0 && cartItems.length === 0) {
      const wagyu = menuItems.find(i => i.name === 'Wagyu Steak')
      const beef = menuItems.find(i => i.name === 'Beef Welli')
      if (wagyu && beef) {
        setCartItems([
          {
            menuItem: wagyu,
            quantity: 1,
            addOns: [
              { name: 'Garlic Butter', price: 1.50 },
              { name: 'Truffle Sauce', price: 2.00 },
            ],
          },
          {
            menuItem: beef,
            quantity: 1,
            addOns: [
              { name: 'Garlic Butter', price: 1.50 },
              { name: 'Truffle Sauce', price: 2.00 },
            ],
          },
        ])
        setSelectedTable('t18')
      }
    }
  }, [menuItems, cartItems.length])

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
    if (cartItems.length === 0) return
    setIsProcessing(true)
    try {
      // In a real app, this would create an order via the API
      if (currentStore) {
        await api.createOrder({
          store_id: currentStore.id,
          table_id: selectedTable || undefined,
          customer_name: customerName || undefined,
          order_type: orderType,
          items: cartItems.map((ci) => ({
            menu_item_id: ci.menuItem.id,
            quantity: ci.quantity,
            add_ons: ci.addOns,
          })),
        })
      }
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
            tables={tables}
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

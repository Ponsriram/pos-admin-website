// API Types based on OpenAPI specification

// Permission Groups
export interface PermissionGroup {
  id: string
  name: string
  permissions: string[]
  created_at: string
}

// Employee Types
export interface Employee {
  id: string
  store_id: string
  user_id?: string
  full_name: string
  email: string
  phone?: string
  role: 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen'
  permission_group_id?: string
  permission_group?: PermissionGroup
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmployeeCreate {
  full_name: string
  email: string
  phone?: string
  role: Employee['role']
  permission_group_id?: string
  is_active?: boolean
}

export interface EmployeeUpdate extends Partial<EmployeeCreate> {}

// Store Create/Update
export interface StoreCreate {
  name: string
  address?: string
  phone?: string
}

export interface StoreUpdate extends Partial<StoreCreate> {}

// Table Create/Update
export interface TableCreate {
  label: string
  capacity: number
}

export interface TableUpdate extends Partial<TableCreate> {
  status?: 'available' | 'occupied' | 'reserved'
}

// Category Create/Update
export interface CategoryCreate {
  name: string
  description?: string
  sort_order?: number
}

export interface CategoryUpdate extends Partial<CategoryCreate> {}

// Menu Item Create/Update
export interface MenuItemCreate {
  category_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  is_available?: boolean
  is_vegetarian?: boolean
}

export interface MenuItemUpdate extends Partial<MenuItemCreate> {}

// Menu Schedule
export interface MenuSchedule {
  id: string
  menu_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

// KOT (Kitchen Order Ticket)
export interface KOT {
  id: string
  order_id: string
  store_id: string
  items: KOTItem[]
  status: 'pending' | 'preparing' | 'ready'
  created_at: string
  printed_at?: string
}

export interface KOTItem {
  menu_item_name: string
  quantity: number
  notes?: string
}

// Inventory
export interface InventoryItem {
  id: string
  store_id: string
  name: string
  sku: string
  quantity: number
  unit: string
  min_stock_level: number
  is_low_stock: boolean
  last_updated: string
}

// Order Timeline Event
export interface OrderTimelineEvent {
  id: string
  order_id: string
  event_type: 'created' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'payment_received'
  description: string
  created_at: string
  created_by?: string
}

// Payment
export interface Payment {
  id: string
  order_id: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transaction_id?: string
  created_at: string
}

// Auth Types
export interface UserRegister {
  email: string
  password: string
  full_name: string
  phone?: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface UserResponse {
  id: string
  email: string
  full_name: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
}

// Store Types
export interface Store {
  id: string
  name: string
  address?: string
  phone?: string
  owner_id: string
  created_at: string
  updated_at: string
  table_count?: number
}

export interface Table {
  id: string
  store_id: string
  label: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved'
}

// Menu Types
export interface Category {
  id: string
  store_id: string
  name: string
  description?: string
  sort_order: number
}

export interface MenuItem {
  id: string
  store_id: string
  category_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  is_available: boolean
  is_vegetarian?: boolean
}

export interface AddOn {
  id: string
  name: string
  price: number
}

// Order Types
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
export type OrderType = 'dine_in' | 'take_away' | 'delivery'
export type PaymentMethod = 'cash' | 'card' | 'upi'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  menu_item_name: string
  quantity: number
  unit_price: number
  add_ons?: OrderItemAddOn[]
  subtotal: number
}

export interface OrderItemAddOn {
  name: string
  price: number
}

export interface Order {
  id: string
  order_number: string
  store_id: string
  table_id?: string
  table_label?: string
  customer_name?: string
  customer_phone?: string
  order_type: OrderType
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method?: PaymentMethod
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
  progress?: number
}

export interface OrderCreate {
  store_id: string
  table_id?: string
  customer_name?: string
  customer_phone?: string
  order_type: OrderType
  items: {
    menu_item_id: string
    quantity: number
    add_ons?: { name: string; price: number }[]
  }[]
}

// Analytics Types
export interface AnalyticsSummary {
  total_revenue: number
  total_orders: number
  net_sales: number
  cash_payments: number
  card_payments: number
  upi_payments: number
  average_order_value: number
  period: string
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

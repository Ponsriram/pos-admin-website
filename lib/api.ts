import type {
  UserRegister,
  UserLogin,
  UserResponse,
  TokenResponse,
  Store,
  StoreCreate,
  StoreUpdate,
  StoreTablesResponse,
  Category,
  CategoryCreate,
  CategoryUpdate,
  MenuItem,
  MenuItemCreate,
  MenuItemUpdate,
  Order,
  OrderCreate,
  AnalyticsSummary,
  Employee,
  EmployeeCreate,
  EmployeeUpdate,
  PermissionGroup,
  KOT,
  InventoryItem,
  OrderTimelineEvent,
  Payment,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token)
    }
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshToken()
      if (refreshed) {
        // Retry the request with new token
        headers['Authorization'] = `Bearer ${this.getToken()}`
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
        })
        if (!retryResponse.ok) {
          throw new Error(`API Error: ${retryResponse.status}`)
        }
        return retryResponse.json()
      } else {
        this.clearToken()
        throw new Error('Session expired')
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || `API Error: ${response.status}`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as unknown as T
    }

    return response.json()
  }

  private async refreshToken(): Promise<boolean> {
    const token = this.getToken()
    if (!token) return false

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) return false

      const data: TokenResponse = await response.json()
      this.setToken(data.access_token)
      return true
    } catch {
      return false
    }
  }

  // ── Auth endpoints ──────────────────────────────────────────────────────

  async register(data: UserRegister): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: UserLogin): Promise<TokenResponse> {
    const response = await this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    this.setToken(response.access_token)
    return response
  }

  async logout(): Promise<void> {
    this.clearToken()
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/users/me')
  }

  // ── Store endpoints ─────────────────────────────────────────────────────

  async getStores(): Promise<Store[]> {
    return this.request<Store[]>('/stores')
  }

  async getStore(id: string): Promise<Store> {
    return this.request<Store>(`/stores/${id}`)
  }

  async createStore(data: StoreCreate): Promise<Store> {
    return this.request<Store>('/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateStore(id: string, data: StoreUpdate): Promise<Store> {
    return this.request<Store>(`/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteStore(id: string): Promise<void> {
    return this.request<void>(`/stores/${id}`, { method: 'DELETE' })
  }

  // ── Table endpoints (dynamic from table_count) ──────────────────────────

  async getStoreTables(storeId: string): Promise<StoreTablesResponse> {
    return this.request<StoreTablesResponse>(`/stores/${storeId}/tables`)
  }

  // ── Employee endpoints ──────────────────────────────────────────────────

  async getEmployees(storeId: string): Promise<Employee[]> {
    return this.request<Employee[]>(`/employees?store_id=${storeId}`)
  }

  async getEmployee(storeId: string, employeeId: string): Promise<Employee> {
    return this.request<Employee>(`/employees/${employeeId}?store_id=${storeId}`)
  }

  async createEmployee(storeId: string, data: EmployeeCreate): Promise<Employee> {
    return this.request<Employee>(`/employees?store_id=${storeId}`, {
      method: 'POST',
      body: JSON.stringify({ ...data, store_id: storeId }),
    })
  }

  async updateEmployee(storeId: string, employeeId: string, data: EmployeeUpdate): Promise<Employee> {
    return this.request<Employee>(`/employees/${employeeId}?store_id=${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteEmployee(storeId: string, employeeId: string): Promise<void> {
    return this.request<void>(`/employees/${employeeId}?store_id=${storeId}`, { method: 'DELETE' })
  }

  // ── Permission Groups ───────────────────────────────────────────────────

  async getPermissionGroups(): Promise<PermissionGroup[]> {
    return this.request<PermissionGroup[]>('/groups')
  }

  // ── Menu/Category endpoints ─────────────────────────────────────────────
  // Note: Backend uses /menus structure. These map to the available endpoints.
  // Categories don't have a direct backend equivalent yet — these calls will
  // gracefully fail until the backend is updated.

  async getCategories(storeId: string): Promise<Category[]> {
    return this.request<Category[]>(`/stores/${storeId}/categories`)
  }

  async createCategory(storeId: string, data: CategoryCreate): Promise<Category> {
    return this.request<Category>(`/stores/${storeId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCategory(storeId: string, categoryId: string, data: CategoryUpdate): Promise<Category> {
    return this.request<Category>(`/stores/${storeId}/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCategory(storeId: string, categoryId: string): Promise<void> {
    return this.request<void>(`/stores/${storeId}/categories/${categoryId}`, { method: 'DELETE' })
  }

  async reorderCategories(storeId: string, categoryIds: string[]): Promise<void> {
    return this.request<void>(`/stores/${storeId}/categories/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ category_ids: categoryIds }),
    })
  }

  // ── Menu Item endpoints ─────────────────────────────────────────────────

  async getMenuItems(storeId: string, categoryId?: string): Promise<MenuItem[]> {
    const params = categoryId ? `?category_id=${categoryId}` : ''
    return this.request<MenuItem[]>(`/stores/${storeId}/menu-items${params}`)
  }

  async createMenuItem(storeId: string, data: MenuItemCreate): Promise<MenuItem> {
    return this.request<MenuItem>(`/stores/${storeId}/menu-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMenuItem(storeId: string, itemId: string, data: MenuItemUpdate): Promise<MenuItem> {
    return this.request<MenuItem>(`/stores/${storeId}/menu-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteMenuItem(storeId: string, itemId: string): Promise<void> {
    return this.request<void>(`/stores/${storeId}/menu-items/${itemId}`, { method: 'DELETE' })
  }

  async reorderMenuItems(storeId: string, categoryId: string, itemIds: string[]): Promise<void> {
    return this.request<void>(`/stores/${storeId}/menu-items/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ category_id: categoryId, item_ids: itemIds }),
    })
  }

  async bulkUpdateMenuItems(storeId: string, itemIds: string[], data: Partial<MenuItemUpdate>): Promise<void> {
    return this.request<void>(`/stores/${storeId}/menu-items/bulk`, {
      method: 'PUT',
      body: JSON.stringify({ item_ids: itemIds, ...data }),
    })
  }

  // ── Order endpoints ─────────────────────────────────────────────────────

  async getOrders(storeId: string, status?: string): Promise<Order[]> {
    const params = new URLSearchParams({ store_id: storeId })
    if (status) params.append('status', status)
    return this.request<Order[]>(`/orders?${params.toString()}`)
  }

  async getOrder(storeId: string, orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}?store_id=${storeId}`)
  }

  async createOrder(data: OrderCreate): Promise<Order> {
    return this.request<Order>(`/orders?store_id=${data.store_id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateOrderStatus(storeId: string, orderId: string, status: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/status?store_id=${storeId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // ── Analytics endpoints ─────────────────────────────────────────────────

  async getAnalyticsSummary(storeId: string): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>(`/analytics/summary?store_id=${storeId}`)
  }

  async getAnalyticsByStore(): Promise<Record<string, AnalyticsSummary>> {
    return this.request<Record<string, AnalyticsSummary>>('/analytics/summary/by-store')
  }

  // ── KOT endpoints ──────────────────────────────────────────────────────

  async getKOTs(storeId: string): Promise<KOT[]> {
    return this.request<KOT[]>(`/stores/${storeId}/kots`)
  }

  async createKOT(storeId: string, orderId: string): Promise<KOT> {
    return this.request<KOT>(`/orders/${orderId}/kot?store_id=${storeId}`, {
      method: 'POST',
    })
  }

  async updateKOTStatus(storeId: string, kotId: string, status: KOT['status']): Promise<KOT> {
    return this.request<KOT>(`/stores/${storeId}/kots/${kotId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // ── Inventory endpoints ─────────────────────────────────────────────────

  async getInventory(storeId: string): Promise<InventoryItem[]> {
    return this.request<InventoryItem[]>(`/stores/${storeId}/inventory/stock`)
  }

  // ── Order Timeline & Payments ───────────────────────────────────────────

  async getOrderTimeline(storeId: string, orderId: string): Promise<OrderTimelineEvent[]> {
    return this.request<OrderTimelineEvent[]>(`/stores/${storeId}/orders/${orderId}/timeline`)
  }

  async getOrderPayments(storeId: string, orderId: string): Promise<Payment[]> {
    return this.request<Payment[]>(`/orders/${orderId}/payments?store_id=${storeId}`)
  }

  async createPayment(storeId: string, orderId: string, data: { amount: number; method: string }): Promise<Payment> {
    return this.request<Payment>(`/orders/${orderId}/payments?store_id=${storeId}`, {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        payment_method: data.method,
        amount: data.amount,
        tip_amount: 0,
      }),
    })
  }

  // ── Bulk order actions ──────────────────────────────────────────────────

  async bulkUpdateOrders(storeId: string, orderIds: string[], status: string): Promise<void> {
    return this.request<void>(`/stores/${storeId}/orders/bulk`, {
      method: 'PUT',
      body: JSON.stringify({ order_ids: orderIds, status }),
    })
  }
}

export const api = new ApiClient(API_BASE_URL)

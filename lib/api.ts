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
  OutletAnalyticsResponse,
  Employee,
  EmployeeCreate,
  EmployeeUpdate,
  PermissionGroup,
  KOT,
  InventoryItem,
  OrderTimelineEvent,
  Payment,
  Shift,
  DayClose,
  ReportTemplate,
  ReportRun,
  Notification,
  Expense,
  ExpenseCreate,
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

  // ── Category endpoints (backend: /products/categories) ──────────────────

  async getCategories(storeId: string): Promise<Category[]> {
    return this.request<Category[]>(`/products/categories?store_id=${storeId}`)
  }

  async createCategory(storeId: string, data: CategoryCreate): Promise<Category> {
    return this.request<Category>(`/products/categories?store_id=${storeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCategory(storeId: string, categoryId: string, data: CategoryUpdate): Promise<Category> {
    return this.request<Category>(`/products/categories/${categoryId}?store_id=${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCategory(storeId: string, categoryId: string): Promise<void> {
    return this.request<void>(`/products/categories/${categoryId}?store_id=${storeId}`, { method: 'DELETE' })
  }

  // ── Product / Menu Item endpoints (backend: /products) ──────────────────

  async getMenuItems(storeId: string, categoryId?: string): Promise<MenuItem[]> {
    const params = new URLSearchParams({ store_id: storeId })
    if (categoryId) params.append('category_id', categoryId)
    return this.request<MenuItem[]>(`/products?${params.toString()}`)
  }

  async createMenuItem(storeId: string, data: MenuItemCreate): Promise<MenuItem> {
    return this.request<MenuItem>(`/products?store_id=${storeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMenuItem(storeId: string, itemId: string, data: MenuItemUpdate): Promise<MenuItem> {
    return this.request<MenuItem>(`/products/${itemId}?store_id=${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteMenuItem(storeId: string, itemId: string): Promise<void> {
    return this.request<void>(`/products/${itemId}?store_id=${storeId}`, { method: 'DELETE' })
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

  async getAnalyticsByStore(): Promise<OutletAnalyticsResponse> {
    return this.request<OutletAnalyticsResponse>('/analytics/summary/by-store')
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
    return this.request<KOT>(`/stores/${storeId}/kots/${kotId}/status`, {
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

  // ── Shift endpoints ─────────────────────────────────────────────────────

  async getShifts(storeId: string, status?: string): Promise<Shift[]> {
    const params = new URLSearchParams({ store_id: storeId })
    if (status) params.append('status', status)
    return this.request<Shift[]>(`/shifts?${params.toString()}`)
  }

  async getShift(shiftId: string): Promise<Shift> {
    return this.request<Shift>(`/shifts/${shiftId}`)
  }

  async getDayCloses(storeId: string): Promise<DayClose[]> {
    return this.request<DayClose[]>(`/shifts/day-close?store_id=${storeId}`)
  }

  async generateDayClose(storeId: string, businessDate: string): Promise<DayClose> {
    return this.request<DayClose>('/shifts/day-close', {
      method: 'POST',
      body: JSON.stringify({ store_id: storeId, business_date: businessDate }),
    })
  }

  // ── Report endpoints ────────────────────────────────────────────────────

  async getReportTypes(category?: string): Promise<ReportTemplate[]> {
    const params = category ? `?category=${category}` : ''
    return this.request<ReportTemplate[]>(`/reports/types${params}`)
  }

  async generateReport(templateCode: string, storeId: string, parameters?: Record<string, unknown>): Promise<ReportRun> {
    return this.request<ReportRun>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({
        template_code: templateCode,
        store_id: storeId,
        parameters: parameters || null,
      }),
    })
  }

  async getReport(reportId: string): Promise<ReportRun> {
    return this.request<ReportRun>(`/reports/${reportId}`)
  }

  async getReports(storeId?: string): Promise<ReportRun[]> {
    const params = storeId ? `?store_id=${storeId}` : ''
    return this.request<ReportRun[]>(`/reports${params}`)
  }

  // ── Notification endpoints ──────────────────────────────────────────────

  async getNotifications(storeId?: string, isRead?: boolean): Promise<Notification[]> {
    const params = new URLSearchParams()
    if (storeId) params.append('store_id', storeId)
    if (isRead !== undefined) params.append('is_read', String(isRead))
    const qs = params.toString()
    return this.request<Notification[]>(`/notifications${qs ? `?${qs}` : ''}`)
  }

  async markNotificationRead(notificationId: string, isRead: boolean = true): Promise<Notification> {
    return this.request<Notification>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
      body: JSON.stringify({ is_read: isRead }),
    })
  }

  async markAllNotificationsRead(storeId?: string): Promise<void> {
    const qs = storeId ? `?store_id=${storeId}` : ''
    return this.request<void>(`/notifications/mark-all-read${qs}`, {
      method: 'POST',
    })
  }

  // ── Expense endpoints ───────────────────────────────────────────────────

  async getExpenses(storeId: string): Promise<Expense[]> {
    return this.request<Expense[]>(`/expenses?store_id=${storeId}`)
  }

  async createExpense(data: ExpenseCreate): Promise<Expense> {
    return this.request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const api = new ApiClient(API_BASE_URL)

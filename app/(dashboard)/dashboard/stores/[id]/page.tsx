'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
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
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  Users,
  Plus,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Store, Table, Employee, AnalyticsSummary } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'

// Demo data
const demoStore: Store = {
  id: '1',
  name: 'Downtown Kitchen',
  address: '123 Main Street, Downtown',
  phone: '+1 (555) 123-4567',
  owner_id: '1',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-03-10T14:30:00Z',
  table_count: 15,
}

const demoTables: Table[] = [
  { id: '1', store_id: '1', label: 'Table 01', capacity: 4, status: 'available' },
  { id: '2', store_id: '1', label: 'Table 02', capacity: 2, status: 'occupied' },
  { id: '3', store_id: '1', label: 'Table 03', capacity: 6, status: 'available' },
  { id: '4', store_id: '1', label: 'Table 04', capacity: 4, status: 'reserved' },
  { id: '5', store_id: '1', label: 'Table 05', capacity: 8, status: 'available' },
  { id: '6', store_id: '1', label: 'Table 06', capacity: 2, status: 'occupied' },
]

const demoEmployees: Employee[] = [
  { id: '1', store_id: '1', full_name: 'John Smith', email: 'john@example.com', phone: '+1 555-1234', role: 'manager', is_active: true, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-03-10T14:30:00Z' },
  { id: '2', store_id: '1', full_name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1 555-2345', role: 'cashier', is_active: true, created_at: '2024-02-01T09:00:00Z', updated_at: '2024-03-08T11:20:00Z' },
  { id: '3', store_id: '1', full_name: 'Mike Wilson', email: 'mike@example.com', phone: '+1 555-3456', role: 'waiter', is_active: true, created_at: '2024-02-20T08:00:00Z', updated_at: '2024-03-05T16:45:00Z' },
  { id: '4', store_id: '1', full_name: 'Emily Davis', email: 'emily@example.com', phone: '+1 555-4567', role: 'kitchen', is_active: false, created_at: '2024-03-01T07:00:00Z', updated_at: '2024-03-03T12:15:00Z' },
]

const demoAnalytics: AnalyticsSummary = {
  total_revenue: 45678.90,
  total_orders: 1234,
  net_sales: 42345.67,
  cash_payments: 15678.90,
  card_payments: 20123.45,
  upi_payments: 6543.22,
  average_order_value: 37.02,
  period: 'last_30_days',
}

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tableForm, setTableForm] = useState({ label: '', capacity: '4' })

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [storeData, tablesData, employeesData, analyticsData] = await Promise.all([
        api.getStore(id),
        api.getStoreTables(id),
        api.getEmployees(id),
        api.getAnalyticsSummary(id),
      ])
      setStore(storeData)
      setTables(tablesData)
      setEmployees(employeesData)
      setAnalytics(analyticsData)
    } catch {
      // Use demo data
      setStore(demoStore)
      setTables(demoTables)
      setEmployees(demoEmployees)
      setAnalytics(demoAnalytics)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTable = async () => {
    if (!tableForm.label) return
    setIsSubmitting(true)
    try {
      const newTable = await api.createTable(id, {
        label: tableForm.label,
        capacity: parseInt(tableForm.capacity),
      })
      setTables((prev) => [...prev, newTable])
      setIsTableDialogOpen(false)
      setTableForm({ label: '', capacity: '4' })
    } catch {
      // Demo: add fake table
      const fakeTable: Table = {
        id: String(tables.length + 1),
        store_id: id,
        label: tableForm.label,
        capacity: parseInt(tableForm.capacity),
        status: 'available',
      }
      setTables((prev) => [...prev, fakeTable])
      setIsTableDialogOpen(false)
      setTableForm({ label: '', capacity: '4' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    try {
      await api.deleteTable(id, tableId)
      setTables((prev) => prev.filter((t) => t.id !== tableId))
    } catch {
      setTables((prev) => prev.filter((t) => t.id !== tableId))
    }
  }

  const tableColumns: ColumnDef<Table>[] = [
    {
      accessorKey: 'label',
      header: 'Table',
      cell: ({ row }) => <span className="font-medium">{row.getValue('label')}</span>,
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          {row.getValue('capacity')} seats
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge
            variant={
              status === 'available' ? 'default' :
              status === 'occupied' ? 'destructive' : 'secondary'
            }
            className={
              status === 'available' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''
            }
          >
            {status}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDeleteTable(row.original.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const employeeColumns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.getValue('full_name')}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue('role')}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={row.getValue('is_active') ? 'default' : 'secondary'}
          className={row.getValue('is_active') ? 'bg-green-500/10 text-green-600' : ''}
        >
          {row.getValue('is_active') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

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
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Store not found</p>
        <Link href="/dashboard/stores">
          <Button variant="link">Back to Stores</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{store.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {store.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {store.address}
                </span>
              )}
              {store.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {store.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {new Date(store.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Store
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees ({employees.length})</TabsTrigger>
          <TabsTrigger value="tables">Tables ({tables.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                <div className="text-2xl font-bold">
                  ${analytics?.total_revenue.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
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
                <div className="text-2xl font-bold">
                  {analytics?.total_orders.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Order Value
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analytics?.average_order_value.toFixed(2) || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per order</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Tables
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tables.filter((t) => t.status === 'occupied').length} / {tables.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Currently occupied</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick links */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <Link href={`/dashboard/orders?store_id=${id}`}>
                <CardHeader>
                  <CardTitle className="text-base">View Orders</CardTitle>
                  <CardDescription>See all orders for this store</CardDescription>
                </CardHeader>
              </Link>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <Link href={`/dashboard/menu?store_id=${id}`}>
                <CardHeader>
                  <CardTitle className="text-base">Manage Menu</CardTitle>
                  <CardDescription>Edit categories and products</CardDescription>
                </CardHeader>
              </Link>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <Link href={`/dashboard/employees?store_id=${id}`}>
                <CardHeader>
                  <CardTitle className="text-base">Manage Staff</CardTitle>
                  <CardDescription>Add or edit employees</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">Staff members assigned to this location</p>
            <Link href={`/dashboard/employees?store_id=${id}`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </Link>
          </div>
          <DataTable
            columns={employeeColumns}
            data={employees}
            searchKey="full_name"
            searchPlaceholder="Search employees..."
          />
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">Tables and seating arrangements</p>
            <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Table
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Table</DialogTitle>
                  <DialogDescription>Create a new table for this store.</DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Table Label</FieldLabel>
                    <Input
                      placeholder="e.g., Table 01"
                      value={tableForm.label}
                      onChange={(e) => setTableForm({ ...tableForm, label: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Capacity</FieldLabel>
                    <Select
                      value={tableForm.capacity}
                      onValueChange={(value) => setTableForm({ ...tableForm, capacity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 4, 6, 8, 10, 12].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} seats
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTable} disabled={!tableForm.label || isSubmitting}>
                    {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                    Add Table
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <DataTable
            columns={tableColumns}
            data={tables}
            searchKey="label"
            searchPlaceholder="Search tables..."
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash</span>
                  <span className="font-medium">${analytics?.cash_payments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Card</span>
                  <span className="font-medium">${analytics?.card_payments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UPI</span>
                  <span className="font-medium">${analytics?.upi_payments.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Net Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  ${analytics?.net_sales.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-2">After taxes and discounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-medium">{analytics?.total_orders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Order</span>
                  <span className="font-medium">${analytics?.average_order_value.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

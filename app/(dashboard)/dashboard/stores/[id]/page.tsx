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
import type { Store, TableLabel, Employee, AnalyticsSummary } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [tables, setTables] = useState<TableLabel[]>([])
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
      const [storeData, tablesResponse, employeesData, analyticsData] = await Promise.all([
        api.getStore(id),
        api.getStoreTables(id),
        api.getEmployees(id),
        api.getAnalyticsSummary(id),
      ])
      setStore(storeData)
      setTables(tablesResponse.tables || [])
      setEmployees(employeesData)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Failed to load store data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTable = async () => {
    if (!tableForm.label) return
    setIsSubmitting(true)
    try {
      // Update the store's table_count via API
      if (store) {
        await api.updateStore(id, { table_count: (store.table_count || 0) + 1 })
        // Refresh tables
        const tablesResponse = await api.getStoreTables(id)
        setTables(tablesResponse.tables || [])
      }
      setIsTableDialogOpen(false)
      setTableForm({ label: '', capacity: '4' })
    } catch (error) {
      console.error('Failed to create table:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTable = async () => {
    try {
      if (store && store.table_count > 0) {
        await api.updateStore(id, { table_count: store.table_count - 1 })
        const tablesResponse = await api.getStoreTables(id)
        setTables(tablesResponse.tables || [])
      }
    } catch (error) {
      console.error('Failed to delete table:', error)
    }
  }

  const tableColumns: ColumnDef<TableLabel>[] = [
    {
      accessorKey: 'table_label',
      header: 'Table',
      cell: ({ row }) => <span className="font-medium">{row.getValue('table_label')}</span>,
    },
    {
      accessorKey: 'table_number',
      header: 'Number',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Table {row.getValue('table_number')}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: () => (
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
              onClick={() => handleDeleteTable()}
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
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
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

  // Compute average order value from analytics
  const averageOrderValue = analytics && analytics.total_orders > 0
    ? analytics.total_revenue / analytics.total_orders
    : 0

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
              {store.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {store.location}
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
                  ${averageOrderValue.toFixed(2)}
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
                  {tables.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total tables</p>
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
            searchKey="name"
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
            searchKey="table_label"
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
                {analytics?.payment_breakdown && Object.entries(analytics.payment_breakdown).map(([method, amount]) => (
                  <div key={method} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{method}</span>
                    <span className="font-medium">${amount.toLocaleString()}</span>
                  </div>
                ))}
                {(!analytics?.payment_breakdown || Object.keys(analytics.payment_breakdown).length === 0) && (
                  <p className="text-muted-foreground text-sm">No payment data</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Net Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  ${analytics?.net_sales.toLocaleString() || '0'}
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
                  <span className="font-medium">{analytics?.total_orders || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Order</span>
                  <span className="font-medium">${averageOrderValue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/contexts/store-context'
import { api } from '@/lib/api'
import type { AnalyticsSummary, Order } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  IndianRupee,
  ShoppingBag,
  CreditCard,
  Banknote,
  Users,
  ArrowUpRight,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))']

export default function DashboardPage() {
  const { currentStore } = useStore()
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!currentStore) return
      setIsLoading(true)
      try {
        const [analyticsData, ordersData] = await Promise.all([
          api.getAnalyticsSummary(currentStore.id),
          api.getOrders(currentStore.id),
        ])
        setAnalytics(analyticsData)
        setRecentOrders(ordersData.slice(0, 10))
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [currentStore])

  const paymentData = analytics
    ? Object.entries(analytics.payment_breakdown || {}).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : []

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value)
  }

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a store to view the dashboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your store overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/employees">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Employees
            </Button>
          </Link>
          <Link href="/dashboard/orders">
            <Button size="sm">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Live Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={analytics ? formatCurrency(analytics.total_revenue) : '-'}
          icon={IndianRupee}
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Orders"
          value={analytics?.total_orders?.toString() || '-'}
          icon={ShoppingBag}
          isLoading={isLoading}
        />
        <MetricCard
          title="Net Sales"
          value={analytics ? formatCurrency(analytics.net_sales) : '-'}
          icon={CreditCard}
          isLoading={isLoading}
        />
        <MetricCard
          title="Tax Collected"
          value={analytics ? formatCurrency(analytics.tax_collected) : '-'}
          icon={Banknote}
          isLoading={isLoading}
        />
      </div>

      {/* Charts and tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment methods chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : paymentData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No payment data yet
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {paymentData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 flex justify-center gap-4">
              {paymentData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Link href="/dashboard/orders/list">
              <Button variant="ghost" size="sm">
                View all
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent orders</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">#{order.order_number || order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name || 'Walk-in'} • {order.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.net_amount || order.total || 0)}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'preparing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : order.status === 'pending'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  isLoading: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

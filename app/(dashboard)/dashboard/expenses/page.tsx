'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/contexts/store-context'
import { api } from '@/lib/api'
import type { Expense } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import {
  Plus,
  Wallet,
  TrendingDown,
  Calendar,
  IndianRupee,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const EXPENSE_CATEGORIES = [
  'ingredients',
  'utilities',
  'rent',
  'salaries',
  'maintenance',
  'marketing',
  'packaging',
  'transport',
  'miscellaneous',
]

export default function ExpensesPage() {
  const { currentStore } = useStore()
  const storeId = currentStore?.id

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    notes: '',
  })

  useEffect(() => {
    if (storeId) loadExpenses()
  }, [storeId])

  const loadExpenses = async () => {
    if (!storeId) return
    setIsLoading(true)
    try {
      const data = await api.getExpenses(storeId)
      setExpenses(data)
    } catch (error) {
      console.error('Failed to load expenses:', error)
      setExpenses([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateExpense = async () => {
    if (!formData.title || !formData.amount || !storeId) return
    setIsSubmitting(true)
    try {
      const newExpense = await api.createExpense({
        store_id: storeId,
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category || undefined,
        notes: formData.notes || undefined,
      })
      setExpenses((prev) => [newExpense, ...prev])
      setIsDialogOpen(false)
      setFormData({ title: '', amount: '', category: '', notes: '' })
    } catch (error) {
      console.error('Failed to create expense:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const todayExpenses = expenses
    .filter((e) => new Date(e.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, e) => sum + e.amount, 0)

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'ingredients': return 'bg-green-500/10 text-green-600'
      case 'utilities': return 'bg-blue-500/10 text-blue-600'
      case 'rent': return 'bg-purple-500/10 text-purple-600'
      case 'salaries': return 'bg-orange-500/10 text-orange-600'
      case 'maintenance': return 'bg-yellow-500/10 text-yellow-700'
      case 'marketing': return 'bg-pink-500/10 text-pink-600'
      case 'packaging': return 'bg-teal-500/10 text-teal-600'
      case 'transport': return 'bg-indigo-500/10 text-indigo-600'
      default: return 'bg-gray-500/10 text-gray-600'
    }
  }

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a store to manage expenses</p>
      </div>
    )
  }

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'title',
      header: 'Expense',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.notes && (
            <p className="text-xs text-muted-foreground line-clamp-1">{row.original.notes}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-semibold text-red-600">
          -₹{row.original.amount.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        row.original.category ? (
          <Badge variant="outline" className={cn('capitalize', getCategoryColor(row.original.category))}>
            {row.original.category}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-muted-foreground">Track store operational expenses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Expense</DialogTitle>
              <DialogDescription>Add a new operational expense entry.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input
                  placeholder="e.g., Vegetable purchase"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Amount (₹)</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Notes (optional)</FieldLabel>
                <Textarea
                  placeholder="Additional details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreateExpense}
                disabled={!formData.title || !formData.amount || isSubmitting}
              >
                {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                Add Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">₹{totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">₹{todayExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <IndianRupee className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entries</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <DataTable
        columns={columns}
        data={expenses}
        searchKey="title"
        searchPlaceholder="Search expenses..."
        isLoading={isLoading}
      />
    </div>
  )
}

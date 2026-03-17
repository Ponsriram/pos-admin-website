'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
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
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, MapPin, Phone, Users, ArrowUpDown, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import type { Store } from '@/lib/types'
import { useStore } from '@/contexts/store-context'
import { Spinner } from '@/components/ui/spinner'

// Demo data
const demoStores: Store[] = [
  {
    id: '1',
    name: 'Downtown Kitchen',
    address: '123 Main Street, Downtown',
    phone: '+1 (555) 123-4567',
    owner_id: '1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-03-10T14:30:00Z',
    table_count: 15,
  },
  {
    id: '2',
    name: 'Seaside Bistro',
    address: '456 Ocean Avenue, Beach District',
    phone: '+1 (555) 234-5678',
    owner_id: '1',
    created_at: '2024-02-01T09:00:00Z',
    updated_at: '2024-03-08T11:20:00Z',
    table_count: 20,
  },
  {
    id: '3',
    name: 'Mountain View Cafe',
    address: '789 Highland Road, Uptown',
    phone: '+1 (555) 345-6789',
    owner_id: '1',
    created_at: '2024-02-20T08:00:00Z',
    updated_at: '2024-03-05T16:45:00Z',
    table_count: 12,
  },
]

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' })
  const { setCurrentStore } = useStore()

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    setIsLoading(true)
    try {
      const data = await api.getStores()
      setStores(data)
    } catch {
      // Use demo data on error
      setStores(demoStores)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateStore = async () => {
    if (!formData.name) return
    setIsSubmitting(true)
    try {
      const newStore = await api.createStore(formData)
      setStores((prev) => [...prev, newStore])
      setIsDialogOpen(false)
      setFormData({ name: '', address: '', phone: '' })
    } catch {
      // Demo: add fake store
      const fakeStore: Store = {
        id: String(stores.length + 1),
        ...formData,
        owner_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        table_count: 0,
      }
      setStores((prev) => [...prev, fakeStore])
      setIsDialogOpen(false)
      setFormData({ name: '', address: '', phone: '' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStore = async (id: string) => {
    try {
      await api.deleteStore(id)
      setStores((prev) => prev.filter((s) => s.id !== id))
    } catch {
      // Demo: remove locally
      setStores((prev) => prev.filter((s) => s.id !== id))
    }
  }

  const columns: ColumnDef<Store>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Store Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate max-w-[200px]">{row.getValue('address') || 'No address'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4 shrink-0" />
          <span>{row.getValue('phone') || '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'table_count',
      header: 'Tables',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary">{row.getValue('table_count') || 0}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.getValue('created_at')).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const store = row.original
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/stores/${store.id}`}>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCurrentStore(store)}>
                  Set as Active
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/stores/${store.id}`}>
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDeleteStore(store.id)}
                >
                  Delete Store
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Stores</h1>
          <p className="text-muted-foreground">Manage your restaurant locations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Store</DialogTitle>
              <DialogDescription>
                Add a new restaurant location to your account.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel>Store Name</FieldLabel>
                <Input
                  placeholder="e.g., Downtown Kitchen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Address</FieldLabel>
                <Input
                  placeholder="e.g., 123 Main Street"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Phone Number</FieldLabel>
                <Input
                  placeholder="e.g., +1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStore} disabled={!formData.name || isSubmitting}>
                {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                Create Store
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={stores}
        searchKey="name"
        searchPlaceholder="Search stores..."
        isLoading={isLoading}
      />
    </div>
  )
}

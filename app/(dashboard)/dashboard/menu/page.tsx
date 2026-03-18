'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  MoreHorizontal,
  Folder,
  FolderOpen,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Category, MenuItem } from '@/lib/types'
import { useStore } from '@/contexts/store-context'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'



export default function MenuPage() {
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get('store_id')
  const { currentStore } = useStore()
  const storeId = storeIdParam || currentStore?.id

  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const [categoryForm, setCategoryForm] = useState({ name: '' })
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    tax_percent: '0',
    is_active: true,
  })

  useEffect(() => {
    if (storeId) loadData()
  }, [storeId])

  const loadData = async () => {
    if (!storeId) return
    setIsLoading(true)
    try {
      const [categoriesData, itemsData] = await Promise.all([
        api.getCategories(storeId),
        api.getMenuItems(storeId),
      ])
      setCategories(categoriesData)
      setMenuItems(itemsData)
    } catch (error) {
      console.error('Failed to load menu:', error)
      setCategories([])
      setMenuItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.category_id === selectedCategory.id)
    : menuItems

  const handleCreateCategory = async () => {
    if (!categoryForm.name || !storeId) return
    setIsSubmitting(true)
    try {
      const newCategory = await api.createCategory(storeId, {
        name: categoryForm.name,
      })
      setCategories((prev) => [...prev, newCategory])
      setIsCategoryDialogOpen(false)
      setCategoryForm({ name: '' })
    } catch (error) {
      console.error('Failed to create category:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !storeId) return
    setIsSubmitting(true)
    try {
      const updated = await api.updateCategory(storeId, editingCategory.id, { name: categoryForm.name })
      setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? updated : c)))
      setEditingCategory(null)
      setCategoryForm({ name: '' })
    } catch (error) {
      console.error('Failed to update category:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!storeId) return
    try {
      await api.deleteCategory(storeId, id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      if (selectedCategory?.id === id) {
        setSelectedCategory(null)
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const handleCreateItem = async () => {
    if (!itemForm.name || !itemForm.price) return
    setIsSubmitting(true)
    const categoryId = selectedCategory?.id || categories[0]?.id
    if (!categoryId || !storeId) return
    try {
      const newItem = await api.createMenuItem(storeId, {
        category_id: categoryId,
        name: itemForm.name,
        description: itemForm.description,
        price: parseFloat(itemForm.price),
        tax_percent: parseFloat(itemForm.tax_percent) || 0,
        is_active: itemForm.is_active,
      })
      setMenuItems((prev) => [...prev, newItem])
      setIsItemDialogOpen(false)
      resetItemForm()
    } catch (error) {
      console.error('Failed to create menu item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem || !storeId) return
    setIsSubmitting(true)
    try {
      const updated = await api.updateMenuItem(storeId, editingItem.id, {
        name: itemForm.name,
        description: itemForm.description,
        price: parseFloat(itemForm.price),
        tax_percent: parseFloat(itemForm.tax_percent) || 0,
        is_active: itemForm.is_active,
      })
      setMenuItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)))
      setEditingItem(null)
      setIsItemDialogOpen(false)
      resetItemForm()
    } catch (error) {
      console.error('Failed to update menu item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!storeId) return
    try {
      await api.deleteMenuItem(storeId, id)
      setMenuItems((prev) => prev.filter((i) => i.id !== id))
    } catch (error) {
      console.error('Failed to delete menu item:', error)
    }
  }

  const handleToggleItemAvailability = async (item: MenuItem) => {
    if (!storeId) return
    try {
      await api.updateMenuItem(storeId, item.id, { is_active: !item.is_active })
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i))
      )
    } catch (error) {
      console.error('Failed to toggle item availability:', error)
    }
  }

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      price: '',
      tax_percent: '0',
      is_active: true,
    })
  }

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      tax_percent: String(item.tax_percent || 0),
      is_active: item.is_active,
    })
    setIsItemDialogOpen(true)
  }

  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
    })
    setIsCategoryDialogOpen(true)
  }

  const columns: ColumnDef<MenuItem>[] = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
              {item.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-muted-foreground line-clamp-1">
                {item.description}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'category_id',
      header: 'Category',
      cell: ({ row }) => {
        const category = categories.find((c) => c.id === row.getValue('category_id'))
        return (
          <Badge variant="outline">{category?.name || 'Uncategorized'}</Badge>
        )
      },
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <span className="font-medium text-primary">
          ₹{(row.getValue('price') as number).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'tax_percent',
      header: 'Tax %',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {(row.getValue('tax_percent') as number || 0)}%
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={item.is_active}
              onCheckedChange={() => handleToggleItemAvailability(item)}
            />
            <span className={item.is_active ? 'text-green-600' : 'text-muted-foreground'}>
              {item.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditItem(item)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleItemAvailability(item)}>
                {item.is_active ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Mark Inactive
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Mark Active
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteItem(item.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Categories Sidebar */}
      <Card className="w-72 shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Categories</CardTitle>
            <Dialog open={isCategoryDialogOpen && !editingCategory} onOpenChange={(open) => {
              setIsCategoryDialogOpen(open)
              if (!open) {
                setEditingCategory(null)
                setCategoryForm({ name: '' })
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Category</DialogTitle>
                  <DialogDescription>Create a new product category.</DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      placeholder="e.g., Appetizers"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    />
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={!categoryForm.name || isSubmitting}>
                    {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                    Add Category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <CardContent className="pt-0">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors',
                  !selectedCategory
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted'
                )}
              >
                <FolderOpen className="h-4 w-4" />
                All Items
                <Badge variant="secondary" className="ml-auto">
                  {menuItems.length}
                </Badge>
              </button>
              {categories.map((category) => {
                const itemCount = menuItems.filter((i) => i.category_id === category.id).length
                const isSelected = selectedCategory?.id === category.id
                return (
                  <div key={category.id} className="group relative">
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted'
                      )}
                    >
                      {isSelected ? (
                        <FolderOpen className="h-4 w-4" />
                      ) : (
                        <Folder className="h-4 w-4" />
                      )}
                      <span className="truncate flex-1">{category.name}</span>
                      <Badge variant="secondary">{itemCount}</Badge>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditCategory(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </ScrollArea>
      </Card>

      {/* Products Table */}
      <div className="flex-1 space-y-4 min-w-0 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              {selectedCategory ? (
                <>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  {selectedCategory.name}
                </>
              ) : (
                'All Menu Items'
              )}
            </h1>
            <p className="text-muted-foreground">
              {filteredItems.length} product{filteredItems.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isItemDialogOpen} onOpenChange={(open) => {
              setIsItemDialogOpen(open)
              if (!open) {
                setEditingItem(null)
                resetItemForm()
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Update product details.' : 'Add a new menu item.'}
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      placeholder="e.g., Grilled Salmon"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      placeholder="Brief description..."
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Price</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={itemForm.price}
                        onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Tax %</FieldLabel>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="0"
                        value={itemForm.tax_percent}
                        onChange={(e) => setItemForm({ ...itemForm, tax_percent: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Field className="flex items-center gap-3">
                    <Switch
                      checked={itemForm.is_active}
                      onCheckedChange={(checked) => setItemForm({ ...itemForm, is_active: checked })}
                    />
                    <FieldLabel className="mb-0">Active</FieldLabel>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={editingItem ? handleUpdateItem : handleCreateItem}
                    disabled={!itemForm.name || !itemForm.price || isSubmitting}
                  >
                    {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                    {editingItem ? 'Save Changes' : 'Add Product'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredItems}
          searchKey="name"
          searchPlaceholder="Search products..."
          isLoading={isLoading}
        />
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => {
        if (!open) {
          setEditingCategory(null)
          setCategoryForm({ name: '' })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={!categoryForm.name || isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  GripVertical,
  Folder,
  FolderOpen,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Leaf,
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
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true,
    is_vegetarian: false,
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
        description: categoryForm.description,
        sort_order: categories.length + 1,
      })
      setCategories((prev) => [...prev, newCategory])
      setIsCategoryDialogOpen(false)
      setCategoryForm({ name: '', description: '' })
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
      const updated = await api.updateCategory(storeId, editingCategory.id, categoryForm)
      setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? updated : c)))
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '' })
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
        image_url: itemForm.image_url || '/api/placeholder/200/200',
        is_available: itemForm.is_available,
        is_vegetarian: itemForm.is_vegetarian,
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
        image_url: itemForm.image_url,
        is_available: itemForm.is_available,
        is_vegetarian: itemForm.is_vegetarian,
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
      await api.updateMenuItem(storeId, item.id, { is_available: !item.is_available })
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i))
      )
    } catch (error) {
      console.error('Failed to toggle item availability:', error)
    }
  }

  const handleBulkToggle = async (available: boolean) => {
    if (!storeId) return
    const ids = selectedItems.map((i) => i.id)
    try {
      await api.bulkUpdateMenuItems(storeId, ids, { is_available: available })
    } catch (error) {
      console.error('Failed to bulk update menu items:', error)
    }
    setMenuItems((prev) =>
      prev.map((i) => (ids.includes(i.id) ? { ...i, is_available: available } : i))
    )
    setSelectedItems([])
  }

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      price: '',
      image_url: '',
      is_available: true,
      is_vegetarian: false,
    })
  }

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      image_url: item.image_url || '',
      is_available: item.is_available,
      is_vegetarian: item.is_vegetarian || false,
    })
    setIsItemDialogOpen(true)
  }

  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
    })
    setIsCategoryDialogOpen(true)
  }

  const columns: ColumnDef<MenuItem>[] = [
    {
      id: 'drag',
      cell: () => (
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
              <Image
                src={item.image_url || '/api/placeholder/200/200'}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
                {item.name}
                {item.is_vegetarian && (
                  <Leaf className="h-4 w-4 text-green-600" />
                )}
              </div>
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
          ${(row.getValue('price') as number).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'is_available',
      header: 'Status',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={item.is_available}
              onCheckedChange={() => handleToggleItemAvailability(item)}
            />
            <span className={item.is_available ? 'text-green-600' : 'text-muted-foreground'}>
              {item.is_available ? 'Available' : 'Unavailable'}
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
                {item.is_available ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Mark Unavailable
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Mark Available
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
                setCategoryForm({ name: '', description: '' })
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
                  <DialogDescription>Create a new menu category.</DialogDescription>
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
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      placeholder="Brief description..."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
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
                      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
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
      <div className="flex-1 space-y-4 min-w-0">
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
            {selectedItems.length > 0 && (
              <>
                <Button variant="outline" onClick={() => handleBulkToggle(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Enable ({selectedItems.length})
                </Button>
                <Button variant="outline" onClick={() => handleBulkToggle(false)}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Disable ({selectedItems.length})
                </Button>
              </>
            )}
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
                    <FieldLabel>Image URL</FieldLabel>
                    <Input
                      placeholder="https://..."
                      value={itemForm.image_url}
                      onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                    />
                  </Field>
                  <div className="flex gap-6">
                    <Field className="flex items-center gap-3">
                      <Switch
                        checked={itemForm.is_available}
                        onCheckedChange={(checked) => setItemForm({ ...itemForm, is_available: checked })}
                      />
                      <FieldLabel className="mb-0">Available</FieldLabel>
                    </Field>
                    <Field className="flex items-center gap-3">
                      <Switch
                        checked={itemForm.is_vegetarian}
                        onCheckedChange={(checked) => setItemForm({ ...itemForm, is_vegetarian: checked })}
                      />
                      <FieldLabel className="mb-0">Vegetarian</FieldLabel>
                    </Field>
                  </div>
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
          enableSelection
          onRowSelectionChange={setSelectedItems}
        />
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => {
        if (!open) {
          setEditingCategory(null)
          setCategoryForm({ name: '', description: '' })
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
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
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

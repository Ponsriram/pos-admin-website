'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  Mail,
  Phone,
  Edit,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Employee, PermissionGroup } from '@/lib/types'
import { useStore } from '@/contexts/store-context'
import { Spinner } from '@/components/ui/spinner'

const roles = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'waiter', label: 'Waiter' },
  { value: 'kitchen', label: 'Kitchen Staff' },
] as const

export default function EmployeesPage() {
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get('store_id')
  const { currentStore } = useStore()
  const storeId = storeIdParam || currentStore?.id

  const [employees, setEmployees] = useState<Employee[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([])
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'waiter' as string,
    employee_code: '',
    pin: '',
    is_active: true,
  })

  useEffect(() => {
    if (storeId) loadData()
  }, [storeId])

  const loadData = async () => {
    if (!storeId) return
    setIsLoading(true)
    try {
      const [employeesData, groupsData] = await Promise.all([
        api.getEmployees(storeId),
        api.getPermissionGroups().catch(() => [] as PermissionGroup[]),
      ])
      setEmployees(employeesData)
      setPermissionGroups(groupsData)
    } catch (error) {
      console.error('Failed to load employees:', error)
      setEmployees([])
      setPermissionGroups([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEmployee = async () => {
    if (!formData.name || !storeId) return
    setIsSubmitting(true)
    try {
      const newEmployee = await api.createEmployee(storeId, {
        store_id: storeId,
        name: formData.name,
        employee_code: formData.employee_code || formData.name.toLowerCase().replace(/\s/g, '_'),
        pin: formData.pin || '0000',
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
      })
      setEmployees((prev) => [...prev, newEmployee])
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create employee:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateEmployee = async () => {
    if (!editingEmployee || !storeId) return
    setIsSubmitting(true)
    try {
      const updated = await api.updateEmployee(storeId, editingEmployee.id, {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
        is_active: formData.is_active,
      })
      setEmployees((prev) => prev.map((e) => (e.id === editingEmployee.id ? updated : e)))
      setIsSheetOpen(false)
      setEditingEmployee(null)
      resetForm()
    } catch (error) {
      console.error('Failed to update employee:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    if (!storeId) return
    try {
      await api.deleteEmployee(storeId, id)
      setEmployees((prev) => prev.filter((e) => e.id !== id))
    } catch (error) {
      console.error('Failed to delete employee:', error)
    }
  }

  const handleToggleActive = async (employee: Employee) => {
    if (!storeId) return
    try {
      await api.updateEmployee(storeId, employee.id, { is_active: !employee.is_active })
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employee.id ? { ...e, is_active: !e.is_active } : e
        )
      )
    } catch (error) {
      console.error('Failed to toggle employee status:', error)
    }
  }

  const handleBulkToggle = async (active: boolean) => {
    const ids = selectedEmployees.map((e) => e.id)
    if (!storeId) return
    for (const id of ids) {
      try {
        await api.updateEmployee(storeId, id, { is_active: active })
      } catch (error) {
        console.error(`Failed to update employee ${id}:`, error)
      }
    }
    setEmployees((prev) =>
      prev.map((e) => (ids.includes(e.id) ? { ...e, is_active: active } : e))
    )
    setSelectedEmployees([])
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'waiter',
      employee_code: '',
      pin: '',
      is_active: true,
    })
  }

  const openEditSheet = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role,
      employee_code: employee.employee_code || '',
      pin: '',
      is_active: employee.is_active,
    })
    setIsSheetOpen(true)
  }

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a store to view employees</p>
      </div>
    )
  }

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Employee
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const employee = row.original
        const initials = employee.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{employee.name}</div>
              <div className="text-sm text-muted-foreground">{employee.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          {row.getValue('phone') || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        const roleColors: Record<string, string> = {
          owner: 'bg-amber-500/10 text-amber-600',
          manager: 'bg-blue-500/10 text-blue-600',
          cashier: 'bg-green-500/10 text-green-600',
          waiter: 'bg-purple-500/10 text-purple-600',
          kitchen: 'bg-orange-500/10 text-orange-600',
        }
        return (
          <Badge variant="outline" className={`capitalize ${roleColors[role] || ''}`}>
            {role}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const employee = row.original
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={employee.is_active}
              onCheckedChange={() => handleToggleActive(employee)}
            />
            <span className={employee.is_active ? 'text-green-600' : 'text-muted-foreground'}>
              {employee.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.getValue('created_at')).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const employee = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditSheet(employee)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleActive(employee)}>
                {employee.is_active ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteEmployee(employee.id)}
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-muted-foreground">Manage staff members and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedEmployees.length > 0 && (
            <>
              <Button variant="outline" onClick={() => handleBulkToggle(true)}>
                <UserCheck className="h-4 w-4 mr-2" />
                Activate ({selectedEmployees.length})
              </Button>
              <Button variant="outline" onClick={() => handleBulkToggle(false)}>
                <UserX className="h-4 w-4 mr-2" />
                Deactivate ({selectedEmployees.length})
              </Button>
            </>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Create a new staff member account.
                </DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel>Full Name</FieldLabel>
                  <Input
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Employee Code</FieldLabel>
                  <Input
                    placeholder="e.g., EMP001"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>PIN</FieldLabel>
                  <Input
                    type="password"
                    placeholder="4-digit PIN"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Phone</FieldLabel>
                  <Input
                    placeholder="+1 555-1234"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEmployee}
                  disabled={!formData.name || isSubmitting}
                >
                  {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                  Add Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        searchKey="name"
        searchPlaceholder="Search employees..."
        isLoading={isLoading}
        enableSelection
        onRowSelectionChange={setSelectedEmployees}
      />

      {/* Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Employee</SheetTitle>
            <SheetDescription>Update employee information</SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <FieldGroup>
              <Field>
                <FieldLabel>Full Name</FieldLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="flex items-center justify-between">
                <FieldLabel>Active Status</FieldLabel>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </Field>
            </FieldGroup>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEmployee} disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

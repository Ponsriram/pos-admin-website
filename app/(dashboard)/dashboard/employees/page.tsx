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

const demoEmployees: Employee[] = [
  { id: '1', store_id: '1', full_name: 'John Smith', email: 'john@example.com', phone: '+1 555-1234', role: 'manager', is_active: true, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-03-10T14:30:00Z' },
  { id: '2', store_id: '1', full_name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1 555-2345', role: 'cashier', is_active: true, created_at: '2024-02-01T09:00:00Z', updated_at: '2024-03-08T11:20:00Z' },
  { id: '3', store_id: '1', full_name: 'Mike Wilson', email: 'mike@example.com', phone: '+1 555-3456', role: 'waiter', is_active: true, created_at: '2024-02-20T08:00:00Z', updated_at: '2024-03-05T16:45:00Z' },
  { id: '4', store_id: '1', full_name: 'Emily Davis', email: 'emily@example.com', phone: '+1 555-4567', role: 'kitchen', is_active: false, created_at: '2024-03-01T07:00:00Z', updated_at: '2024-03-03T12:15:00Z' },
  { id: '5', store_id: '1', full_name: 'David Brown', email: 'david@example.com', phone: '+1 555-5678', role: 'waiter', is_active: true, created_at: '2024-03-05T06:00:00Z', updated_at: '2024-03-10T10:00:00Z' },
]

const demoGroups: PermissionGroup[] = [
  { id: '1', name: 'Full Access', permissions: ['read', 'write', 'delete', 'admin'], created_at: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'Manager', permissions: ['read', 'write'], created_at: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'Staff', permissions: ['read'], created_at: '2024-01-01T00:00:00Z' },
]

export default function EmployeesPage() {
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get('store_id')
  const { currentStore } = useStore()
  const storeId = storeIdParam || currentStore?.id || '1'

  const [employees, setEmployees] = useState<Employee[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([])
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'waiter' as Employee['role'],
    permission_group_id: '',
    is_active: true,
  })

  useEffect(() => {
    loadData()
  }, [storeId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [employeesData, groupsData] = await Promise.all([
        api.getEmployees(storeId),
        api.getPermissionGroups(),
      ])
      setEmployees(employeesData)
      setPermissionGroups(groupsData)
    } catch {
      setEmployees(demoEmployees)
      setPermissionGroups(demoGroups)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEmployee = async () => {
    if (!formData.full_name || !formData.email) return
    setIsSubmitting(true)
    try {
      const newEmployee = await api.createEmployee(storeId, formData)
      setEmployees((prev) => [...prev, newEmployee])
      setIsDialogOpen(false)
      resetForm()
    } catch {
      const fakeEmployee: Employee = {
        id: String(employees.length + 1),
        store_id: storeId,
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setEmployees((prev) => [...prev, fakeEmployee])
      setIsDialogOpen(false)
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return
    setIsSubmitting(true)
    try {
      const updated = await api.updateEmployee(storeId, editingEmployee.id, formData)
      setEmployees((prev) => prev.map((e) => (e.id === editingEmployee.id ? updated : e)))
      setIsSheetOpen(false)
      setEditingEmployee(null)
      resetForm()
    } catch {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editingEmployee.id ? { ...e, ...formData, updated_at: new Date().toISOString() } : e
        )
      )
      setIsSheetOpen(false)
      setEditingEmployee(null)
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    try {
      await api.deleteEmployee(storeId, id)
      setEmployees((prev) => prev.filter((e) => e.id !== id))
    } catch {
      setEmployees((prev) => prev.filter((e) => e.id !== id))
    }
  }

  const handleToggleActive = async (employee: Employee) => {
    try {
      await api.updateEmployee(storeId, employee.id, { is_active: !employee.is_active })
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employee.id ? { ...e, is_active: !e.is_active } : e
        )
      )
    } catch {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employee.id ? { ...e, is_active: !e.is_active } : e
        )
      )
    }
  }

  const handleBulkToggle = async (active: boolean) => {
    const ids = selectedEmployees.map((e) => e.id)
    setEmployees((prev) =>
      prev.map((e) => (ids.includes(e.id) ? { ...e, is_active: active } : e))
    )
    setSelectedEmployees([])
  }

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'waiter',
      permission_group_id: '',
      is_active: true,
    })
  }

  const openEditSheet = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone || '',
      role: employee.role,
      permission_group_id: employee.permission_group_id || '',
      is_active: employee.is_active,
    })
    setIsSheetOpen(true)
  }

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'full_name',
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
        const initials = employee.full_name
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
              <div className="font-medium">{employee.full_name}</div>
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
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                    onValueChange={(value) => setFormData({ ...formData, role: value as Employee['role'] })}
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
                <Field>
                  <FieldLabel>Permission Group</FieldLabel>
                  <Select
                    value={formData.permission_group_id}
                    onValueChange={(value) => setFormData({ ...formData, permission_group_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {permissionGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
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
                  disabled={!formData.full_name || !formData.email || isSubmitting}
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
        searchKey="full_name"
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
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                  onValueChange={(value) => setFormData({ ...formData, role: value as Employee['role'] })}
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
              <Field>
                <FieldLabel>Permission Group</FieldLabel>
                <Select
                  value={formData.permission_group_id}
                  onValueChange={(value) => setFormData({ ...formData, permission_group_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
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

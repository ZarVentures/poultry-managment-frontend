"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, X, Users, UserCheck, Shield, Briefcase, Lock, Unlock, Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { usersApi, permissionsApi, type User as ApiUser } from "@/lib/api"
import { toast } from "sonner"

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userPermissions, setUserPermissions] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "staff" as "admin" | "manager" | "staff",
    status: "active" as "active" | "inactive",
    joinDate: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    setMounted(true)
    fetchUsers()
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      const perms = await permissionsApi.getMyPermissions()
      setUserPermissions(perms)
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    }
  }

  const canCreate = userPermissions?.permissions?.users?.canCreate || false
  const canDelete = userPermissions?.permissions?.users?.canDelete || false
  const canUpdate = userPermissions?.permissions?.users?.canUpdate || false

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await usersApi.getAll()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error("Failed to fetch users:", error)
      toast.error("Failed to load users")
      setUsers([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "staff",
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
      notes: "",
    })
    setEditingId(null)
  }

  const handleEdit = (user: ApiUser) => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role: user.role,
      status: user.status,
      joinDate: user.joinDate || new Date().toISOString().split("T")[0],
      notes: user.notes || "",
    })
    setEditingId(user.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Please fill all required fields (Name and Email)")
      return
    }

    if (!editingId && !formData.password) {
      toast.error("Password is required for new users")
      return
    }

    try {
      setLoading(true)
      
      if (editingId) {
        await usersApi.update(editingId, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          status: formData.status,
          notes: formData.notes || undefined,
        })
        toast.success("User updated successfully")
      } else {
        await usersApi.create({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          role: formData.role,
          status: formData.status,
          notes: formData.notes || undefined,
        })
        toast.success("User created successfully")
      }

      await fetchUsers()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error('Failed to save user:', error)
      toast.error(error.message || (editingId ? "Failed to update user" : "Failed to create user"))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, currentStatus: string) => {
    if (!canDelete) {
      toast.error("You don't have permission to deactivate users")
      return
    }

    if (currentStatus === 'inactive') {
      toast.info("User is already inactive")
      return
    }

    if (!confirm("Are you sure you want to deactivate this user? They will no longer be able to log in.")) return

    try {
      setLoading(true)
      await usersApi.updateStatus(id, 'inactive')
      toast.success("User deactivated successfully")
      await fetchUsers()
    } catch (error: any) {
      console.error('Failed to deactivate user:', error)
      toast.error("Failed to deactivate user")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    try {
      setLoading(true)
      // Use activate/deactivate endpoints
      if (newStatus === "active") {
        await usersApi.updateStatus(id, "active")
      } else {
        await usersApi.updateStatus(id, "inactive")
      }
      toast.success(`User ${newStatus === "active" ? "activated" : "deactivated"} successfully`)
      await fetchUsers()
    } catch (error: any) {
      console.error('Failed to toggle user status:', error)
      toast.error("Failed to update user status")
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    if (!Array.isArray(users)) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        administrators: 0,
        managers: 0,
        staff: 0
      }
    }
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      administrators: users.filter(u => u.role === 'admin').length,
      managers: users.filter(u => u.role === 'manager').length,
      staff: users.filter(u => u.role === 'staff').length
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return []
    
    return users.filter(user => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone && user.phone.toLowerCase().includes(searchLower))
      
      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      
      // Status filter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter
      
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage staff accounts and permissions</p>
          </div>
          {canCreate && (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2" size={20} />
                  Add New User
                </Button>
              </DialogTrigger>
            <DialogContent aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit User" : "Add New User"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit user details" : "Add a new user to the system"}
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@azizpoultry.com"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Join Date</Label>
                  <DatePicker
                    value={formData.joinDate}
                    onChange={(date) => setFormData({ ...formData, joinDate: date })}
                    disabled={loading}
                  />
                </div>
                {!editingId && (
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Password"
                      disabled={loading}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1" disabled={loading}>
                    {loading ? "Saving..." : editingId ? "Update" : "Create"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
                    <X size={20} />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <button className="text-xs text-blue-600 hover:underline mt-1">View details</button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <button className="text-xs text-blue-600 hover:underline mt-1">View details</button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.administrators}</div>
              <button className="text-xs text-blue-600 hover:underline mt-1">View details</button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operators</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.managers + stats.staff}</div>
              <button className="text-xs text-blue-600 hover:underline mt-1">View details</button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Accounts List</CardTitle>
            <p className="text-sm text-muted-foreground">Manage all user accounts and permissions</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter size={16} />
                  Filter
                </Button>
              </div>

              <div className="flex gap-4">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading && users.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Loading...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  {searchQuery || roleFilter !== "all" || statusFilter !== "all" 
                    ? "No users match your filters" 
                    : "No users found"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Manager' : 'Operator'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                            {user.status === 'inactive' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Locked
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleToggleStatus(user.id, user.status)}
                              title={user.status === "active" ? "Lock user" : "Unlock user"}
                              disabled={!canUpdate}
                            >
                              {user.status === "active" ? <Unlock size={16} className="text-green-600" /> : <Lock size={16} className="text-red-600" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} disabled={!canUpdate}>
                              <Edit2 size={16} />
                            </Button>
                            {canDelete && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(user.id, user.status)}
                                disabled={user.status === 'inactive'}
                                title={user.status === 'inactive' ? "User is already inactive" : "Deactivate user"}
                              >
                                <Trash2 size={16} className={user.status === 'inactive' ? 'text-gray-400' : 'text-red-600'} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

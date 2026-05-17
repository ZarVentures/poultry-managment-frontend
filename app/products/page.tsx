"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { type Product, type CreateProductDto, productsApi } from "@/lib/api"
import { toast } from "sonner"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [formData, setFormData] = useState<CreateProductDto>({
    name: "",
    category: "",
    productType: "other",
    unit: "",
    price: "",
    description: "",
    status: "active",
  })

  useEffect(() => {
    setMounted(true)
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await productsApi.getAll()
      setProducts(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error("Failed to fetch products:", error)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      productType: "other",
      unit: "",
      price: "",
      description: "",
      status: "active",
    })
    setEditingId(null)
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category || "",
      productType: product.productType || "other",
      unit: product.unit || "",
      price: product.price ? String(product.price) : "",
      description: product.description || "",
      status: product.status,
    })
    setEditingId(product.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Product name is required")
      return
    }

    try {
      setLoading(true)
      if (editingId) {
        await productsApi.update(editingId, formData)
        toast.success("Product updated successfully")
      } else {
        await productsApi.create(formData)
        toast.success("Product created successfully")
      }
      await fetchProducts()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save product:", error)
      toast.error(error.message || "Failed to save product")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      setLoading(true)
      await productsApi.delete(id)
      toast.success("Product deleted successfully")
      await fetchProducts()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      setLoading(true)
      await productsApi.updateStatus(id, newStatus)
      toast.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      await fetchProducts()
    } catch (error: any) {
      toast.error(error.message || "Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = products

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(p => p.productType === typeFilter)
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    return filtered
  }, [products, searchQuery, typeFilter, statusFilter])

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      inactive: products.filter(p => p.status === 'inactive').length,
      byType: products.reduce((acc, p) => {
        const type = p.productType || 'other'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }
  }, [products])

  const getProductTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      eggs: "Eggs",
      meat: "Meat",
      chicks: "Chicks",
      feed: "Feed",
      medicine: "Medicine",
      equipment: "Equipment",
      other: "Other",
    }
    return labels[type] || type
  }

  const getProductTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      eggs: "🥚",
      meat: "🍗",
      chicks: "🐣",
      feed: "🌾",
      medicine: "💊",
      equipment: "🔧",
      other: "📦",
    }
    return icons[type] || "📦"
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">Manage products for purchase, sales, and inventory</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit product details" : "Create a new product"}
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Broiler Chicken, Layer Feed"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Type *</Label>
                    <Select
                      value={formData.productType}
                      onValueChange={(value: any) => setFormData({ ...formData, productType: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eggs">🥚 Eggs</SelectItem>
                        <SelectItem value="meat">🍗 Meat</SelectItem>
                        <SelectItem value="chicks">🐣 Chicks</SelectItem>
                        <SelectItem value="feed">🌾 Feed</SelectItem>
                        <SelectItem value="medicine">💊 Medicine</SelectItem>
                        <SelectItem value="equipment">🔧 Equipment</SelectItem>
                        <SelectItem value="other">📦 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Poultry, Supplies"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., kg, piece, bag"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description and details"
                    disabled={loading}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
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

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={loading} className="flex-1">
                    {loading ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byType).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="eggs">Eggs</SelectItem>
                  <SelectItem value="meat">Meat</SelectItem>
                  <SelectItem value="chicks">Chicks</SelectItem>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="pt-6">
            {loading && !products.length ? (
              <div className="text-center py-8 text-muted-foreground">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto mb-2" size={48} />
                <p>No products found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            {getProductTypeIcon(product.productType || 'other')}
                            {getProductTypeLabel(product.productType || 'other')}
                          </span>
                        </TableCell>
                        <TableCell>{product.category || '-'}</TableCell>
                        <TableCell>{product.unit || '-'}</TableCell>
                        <TableCell className="text-right">
                          {product.price ? `₹${Number(product.price).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleStatus(product.id, product.status)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              product.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                            disabled={loading}
                          >
                            {product.status === 'active' ? (
                              <><CheckCircle size={12} /> Active</>
                            ) : (
                              <><XCircle size={12} /> Inactive</>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(product)}
                              disabled={loading}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(product.id)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

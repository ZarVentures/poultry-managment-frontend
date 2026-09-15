"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit2, Tag, Trash2 } from "lucide-react"
import { expenseCategoriesApi, type ExpenseCategory } from "@/lib/api"
import { usePermissions } from "@/lib/permissions"
import { toast } from "sonner"

export default function ExpenseCategoriesPage() {
  const { canCreate, canUpdate, canDelete } = usePermissions()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "tag",
    appliesTo: "both" as "both" | "main" | "godown",
    isActive: true,
  })

  const fetchCategories = async () => {
    try {
      setListLoading(true)
      const data = await expenseCategoriesApi.getAll(true)
      setCategories(data)
    } catch {
      toast.error("Failed to fetch categories")
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const openCreate = () => {
    setEditingCategory(null)
    setFormData({ name: "", description: "", icon: "tag", appliesTo: "both", isActive: true })
    setShowModal(true)
  }

  const openEdit = (cat: ExpenseCategory) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      description: cat.description || "",
      icon: "tag",
      appliesTo: cat.appliesTo || "both",
      isActive: cat.isActive,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Name is required")
      return
    }
    try {
      setLoading(true)
      if (editingCategory) {
        await expenseCategoriesApi.update(editingCategory.id, formData)
        toast.success("Category updated")
      } else {
        await expenseCategoriesApi.create(formData)
        toast.success("Category created")
      }
      setShowModal(false)
      await fetchCategories()
    } catch (e: any) {
      toast.error(e.message || "Failed to save category")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, isDefault: boolean) => {
    if (isDefault) {
      toast.error("Default categories cannot be deleted")
      return
    }
    if (!window.confirm("Are you sure?")) return
    try {
      await expenseCategoriesApi.delete(id)
      toast.success("Category deleted")
      fetchCategories()
    } catch {
      toast.error("Failed to delete")
    }
  }

  const handleToggle = async (id: number) => {
    const category = categories.find((c) => c.id === id)
    if (!category) return
    try {
      await expenseCategoriesApi.update(id, { isActive: !category.isActive })
      fetchCategories()
      toast.success(`Category ${!category.isActive ? "activated" : "deactivated"}`)
    } catch {
      toast.error("Failed to toggle status")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Expense Categories</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Create and manage categories used when adding expenses.
            </p>
          </div>
          {canCreate("expenses") && (
            <Button size="default" className="rounded-full shrink-0" onClick={openCreate}>
              + New Category
            </Button>
          )}
        </div>

        {listLoading ? (
          <div className="flex justify-center p-12 text-muted-foreground animate-pulse text-sm">Loading categories...</div>
        ) : (
          <div className="rounded-2xl border overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-muted/50 dark:bg-slate-800 border-b dark:border-slate-700">
                  <tr className="text-xs uppercase text-muted-foreground">
                    <th className="text-left p-4 font-semibold">Category</th>
                    <th className="text-left p-4 font-semibold">Description</th>
                    <th className="text-center p-4 font-semibold">Applies To</th>
                    <th className="text-center p-4 font-semibold">Status</th>
                    <th className="text-right p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                            <Tag size={16} />
                          </div>
                          <div>
                            <p className="font-medium">{cat.name}</p>
                            {cat.isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm leading-relaxed max-w-xs">{cat.description || "-"}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            (cat.appliesTo || "both") === "main"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                              : (cat.appliesTo || "both") === "godown"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                          }`}
                        >
                          {(cat.appliesTo || "both") === "both" ? "Both" : (cat.appliesTo || "both") === "main" ? "Main" : "Godown"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => canUpdate("expenses") && handleToggle(cat.id)}
                          disabled={!canUpdate("expenses")}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${cat.isActive ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"}`}
                        >
                          {cat.isActive ? "ACTIVE" : "INACTIVE"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {canUpdate("expenses") && (
                            <button
                              onClick={() => openEdit(cat)}
                              className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canDelete("expenses") && !cat.isDefault && (
                            <button
                              onClick={() => handleDelete(cat.id, cat.isDefault)}
                              className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No categories yet. Create one to use in expenses.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="!w-[min(28rem,calc(100vw-2rem))] sm:!w-full">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Expense Category" : "Add New Expense Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                placeholder="e.g. Electricity Bill"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={editingCategory?.isDefault}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="What is this for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Applies To *</Label>
              <Select
                value={formData.appliesTo}
                onValueChange={(v) => setFormData({ ...formData, appliesTo: v as any })}
              >
                <SelectTrigger className="!h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both (Main & Godown)</SelectItem>
                  <SelectItem value="main">Main Expenses Only</SelectItem>
                  <SelectItem value="godown">Godown Expenses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="cat-active"
                className="h-4 w-4 rounded"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label htmlFor="cat-active">Mark as Active</Label>
            </div>
            <Button className="w-full rounded-full" onClick={handleSave} disabled={loading || !formData.name}>
              {loading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

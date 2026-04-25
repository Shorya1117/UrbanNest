import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { categoryAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Input, Select, Spinner, EmptyState, Modal, ConfirmDialog, Badge } from "../../components/ui";

function CategoryForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || { name: "", type: "MARKETPLACE" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Category name is required.");
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Category Name *"
        placeholder="e.g. Electronics"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      {!initial && (
        <Select
          label="Type *"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="MARKETPLACE">Marketplace</option>
          <option value="SERVICE">Service</option>
        </Select>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? "Save Changes" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}

function CategorySection({ title, type, categories, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-6 rounded-full ${type === "MARKETPLACE" ? "bg-primary" : "bg-purple-500"}`} />
        <h2 className="font-extrabold text-gray-900">{title}</h2>
        <span className="text-xs text-gray-400 font-medium">({categories.length})</span>
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-3">No {title.toLowerCase()} categories yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <div key={cat._id}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                cat.isActive
                  ? "bg-white border-gray-100 hover:border-primary/40 hover:shadow-card"
                  : "bg-gray-50 border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Tag size={14} className={type === "MARKETPLACE" ? "text-primary shrink-0" : "text-purple-500 shrink-0"} />
                <span className="text-sm font-bold text-gray-800 truncate">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => onEdit(cat)}
                  className="p-1 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => onDelete(cat)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll();
      setCategories(res.data.data.categories);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const marketplace = categories.filter((c) => c.type === "MARKETPLACE");
  const service     = categories.filter((c) => c.type === "SERVICE");

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const res = await categoryAPI.create(form);
      setCategories((prev) => [...prev, res.data.data.category]);
      setShowAdd(false);
      toast.success("Category created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally { setSaving(false); }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      const res = await categoryAPI.update(editTarget._id, form);
      setCategories((prev) => prev.map((c) => c._id === editTarget._id ? res.data.data.category : c));
      setEditTarget(null);
      toast.success("Category updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await categoryAPI.remove(deleteTarget._id);
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success("Category deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    } finally { setDeleting(false); }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Categories"
        description="Manage marketplace and service categories for your society"
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Category
          </Button>
        }
      />

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-10">
          <CategorySection
            title="Marketplace Categories"
            type="MARKETPLACE"
            categories={marketplace}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
          <CategorySection
            title="Service Categories"
            type="SERVICE"
            categories={service}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Category" maxWidth="max-w-sm">
        <CategoryForm onSave={handleCreate} onCancel={() => setShowAdd(false)} loading={saving} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Category" maxWidth="max-w-sm">
        <CategoryForm
          initial={editTarget}
          onSave={handleEdit}
          onCancel={() => setEditTarget(null)}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        description={`Delete "${deleteTarget?.name}"? This may affect existing listings or services using this category.`}
        loading={deleting}
      />
    </PageLayout>
  );
}
import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Wrench, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { serviceAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Input, Spinner, EmptyState, Modal, Textarea, ConfirmDialog, Avatar } from "../../components/ui";

function ServiceForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || { name: "", serviceType: "", phone: "", description: "" });
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.serviceType || !form.phone) return toast.error("Name, service type and phone are required.");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("image", file);
    onSave(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Provider Name *" placeholder="e.g. Ramesh Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Service Type *" placeholder="e.g. plumber, maid" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} />
        <Input label="Phone *" placeholder="+91 9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <Textarea label="Description" placeholder="Brief description of services offered..." value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
      <div className="space-y-1.5">
        <label className="label">Photo</label>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100" />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">{initial ? "Save Changes" : "Add Service"}</Button>
      </div>
    </form>
  );
}

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await serviceAPI.getAll();
      setServices(res.data.data.services);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handleAdd = async (fd) => {
    setSaving(true);
    try {
      const res = await serviceAPI.add(fd);
      setServices((prev) => [res.data.data.service, ...prev]);
      setShowAdd(false);
      toast.success("Service provider added!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally { setSaving(false); }
  };

  const handleEdit = async (fd) => {
    setSaving(true);
    try {
      const res = await serviceAPI.update(editTarget._id, fd);
      setServices((prev) => prev.map((s) => s._id === editTarget._id ? res.data.data.service : s));
      setEditTarget(null);
      toast.success("Service updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await serviceAPI.remove(deleteTarget._id);
      setServices((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success("Service deleted.");
    } catch { toast.error("Failed to delete."); }
    finally { setDeleting(false); }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Service Providers"
        description="Manage trusted service providers for your society"
        action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Service</Button>}
      />

      {loading ? <Spinner /> : services.length === 0 ? (
        <EmptyState icon={Wrench} title="No service providers yet"
          description="Add trusted professionals your residents can contact."
          action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Service</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <div key={s._id} className="card border border-gray-100 hover:shadow-card-hover transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 overflow-hidden">
                  {s.photo?.url
                    ? <img src={s.photo.url} alt={s.name} className="w-full h-full object-cover" />
                    : <Wrench className="w-7 h-7 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-gray-900 truncate">{s.name}</h3>
                  <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full font-semibold capitalize">
                    {s.serviceType}
                  </span>
                </div>
              </div>
              {s.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.description}</p>}
              <div className="flex items-center justify-between">
                <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                  <Phone size={13} /> {s.phone}
                </a>
                <div className="flex gap-2">
                  <button onClick={() => setEditTarget(s)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Service Provider">
        <ServiceForm onSave={handleAdd} onCancel={() => setShowAdd(false)} loading={saving} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Service Provider">
        <ServiceForm initial={editTarget} onSave={handleEdit} onCancel={() => setEditTarget(null)} loading={saving} />
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Service" description={`Remove ${deleteTarget?.name} from the directory?`} loading={deleting} />
    </PageLayout>
  );
}

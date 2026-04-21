import { useEffect, useState, useCallback } from "react";
import { Plus, Search, UserCheck, Pencil, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { userAPI, flatAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Input, Select, Badge, Spinner, EmptyState, Modal, Avatar, ConfirmDialog } from "../../components/ui";

const ROLES = ["HEAD", "MEMBER"];

function ResidentForm({ initial, flats, residents, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || { name: "", email: "", phone: "", role: "MEMBER", flatId: "", parentId: "", isApproved: true });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return toast.error("Name, email and phone are required.");
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name *" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Phone *" placeholder="+91 9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <Input label="Email *" type="email" placeholder="resident@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Role *" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
        <Select label="Flat" value={form.flatId} onChange={(e) => setForm({ ...form, flatId: e.target.value })}>
          <option value="">No flat assigned</option>
          {flats.map((f) => <option key={f._id} value={f._id}>{f.blockNumber}-{f.flatNumber}</option>)}
        </Select>
      </div>
      {form.role === "MEMBER" && (
        <Select label="Parent (HEAD)" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
          <option value="">None</option>
          {residents.filter((r) => r.role === "HEAD").map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
        </Select>
      )}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.isApproved}
          onChange={(e) => setForm({ ...form, isApproved: e.target.checked })} />
        <span className="text-sm font-semibold text-gray-700">Approve immediately</span>
      </label>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">{initial ? "Save Changes" : "Add Resident"}</Button>
      </div>
    </form>
  );
}

export default function AdminResidents() {
  const [residents, setResidents] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      const [rRes, fRes] = await Promise.all([userAPI.getAll(params), flatAPI.getAll()]);
      setResidents(rRes.data.data.residents);
      setFlats(fRes.data.data.flats);
    } catch { } finally { setLoading(false); }
  }, [roleFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = residents.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (form) => {
    setSaving(true);
    try {
      const res = await userAPI.add(form);
      setResidents((prev) => [res.data.data.user, ...prev]);
      setShowAdd(false);
      toast.success("Resident added!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add.");
    } finally { setSaving(false); }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      const res = await userAPI.update(editTarget._id, form);
      setResidents((prev) => prev.map((r) => r._id === editTarget._id ? res.data.data.user : r));
      setEditTarget(null);
      toast.success("Resident updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userAPI.remove(deleteTarget._id);
      setResidents((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success("Resident removed.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove.");
    } finally { setDeleting(false); }
  };

  const handleApprove = async (resident) => {
    try {
      await userAPI.update(resident._id, { isApproved: true });
      setResidents((prev) => prev.map((r) => r._id === resident._id ? { ...r, isApproved: true } : r));
      toast.success("Resident approved!");
    } catch { toast.error("Failed to approve."); }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Residents"
        description="Manage all residents in your society"
        action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Resident</Button>}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input className="input pl-9" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No residents found" action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Resident</Button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Resident", "Flat", "Role", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={r.avatar?.url} name={r.name} size="sm" />
                        <div>
                          <p className="font-bold text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-500">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {r.flatId ? `${r.flatId.blockNumber}-${r.flatId.flatNumber}` : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4"><Badge label={r.role} /></td>
                    <td className="px-5 py-4">
                      {r.isApproved
                        ? <span className="badge-resolved">Active</span>
                        : <button onClick={() => handleApprove(r)} className="badge-pending cursor-pointer hover:bg-yellow-200 transition-colors">
                            <UserCheck size={10} className="inline mr-1" />Approve
                          </button>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setEditTarget(r)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Resident">
        <ResidentForm flats={flats} residents={residents} onSave={handleAdd} onCancel={() => setShowAdd(false)} loading={saving} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Resident">
        <ResidentForm initial={editTarget} flats={flats} residents={residents} onSave={handleEdit} onCancel={() => setEditTarget(null)} loading={saving} />
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Remove Resident" description={`Are you sure you want to remove ${deleteTarget?.name}? This action cannot be undone.`} loading={deleting} />
    </PageLayout>
  );
}

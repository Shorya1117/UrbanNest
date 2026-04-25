import { useEffect, useState, useCallback } from "react";
import { Plus, Building2, Pencil, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { flatAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Input, Select, Spinner, EmptyState, Modal, ConfirmDialog, Avatar, Badge } from "../../components/ui";

function FlatForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || { flatNumber: "", blockNumber: "", floor: "", ownershipType: "OWNER" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.flatNumber || !form.blockNumber) return toast.error("Flat and block number are required.");
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Flat Number *" placeholder="e.g. 101" value={form.flatNumber} onChange={(e) => setForm({ ...form, flatNumber: e.target.value.toUpperCase() })} />
        <Input label="Block / Tower *" placeholder="e.g. A" value={form.blockNumber} onChange={(e) => setForm({ ...form, blockNumber: e.target.value.toUpperCase() })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Floor" type="number" placeholder="e.g. 1" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
        <Select label="Ownership Type *" value={form.ownershipType} onChange={(e) => setForm({ ...form, ownershipType: e.target.value })}>
          <option value="OWNER">Owner</option>
          <option value="TENANT">Tenant</option>
        </Select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">{initial ? "Save Changes" : "Create Flat"}</Button>
      </div>
    </form>
  );
}

export default function AdminFlats() {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMembers, setViewMembers] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFlats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await flatAPI.getAll();
      setFlats(res.data.data.flats);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFlats(); }, [fetchFlats]);

  const handleAdd = async (form) => {
    setSaving(true);
    try {
      const res = await flatAPI.create(form);
      setFlats((prev) => [...prev, res.data.data.flat]);
      setShowAdd(false);
      toast.success("Flat created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally { setSaving(false); }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      const res = await flatAPI.update(editTarget._id, form);
      setFlats((prev) => prev.map((f) => f._id === editTarget._id ? res.data.data.flat : f));
      setEditTarget(null);
      toast.success("Flat updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await flatAPI.remove(deleteTarget._id);
      setFlats((prev) => prev.filter((f) => f._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success("Flat deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed. Ensure no residents are assigned.");
    } finally { setDeleting(false); }
  };

  // Group by block
  const blocks = [...new Set(flats.map((f) => f.blockNumber))].sort();

  return (
    <PageLayout>
      <PageHeader
        title="Flats"
        description="Manage all flats and households in your society"
        action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Flat</Button>}
      />

      {loading ? <Spinner /> : flats.length === 0 ? (
        <EmptyState icon={Building2} title="No flats added"
          description="Start by adding flats to your society."
          action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Flat</Button>} />
      ) : (
        <div className="space-y-8">
          {blocks.map((block) => (
            <div key={block}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-secondary-50 flex items-center justify-center">
                  <Building2 size={16} className="text-secondary" />
                </div>
                <h2 className="font-extrabold text-gray-900">Block {block}</h2>
                <span className="text-xs text-gray-400">{flats.filter((f) => f.blockNumber === block).length} flats</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {flats.filter((f) => f.blockNumber === block).sort((a, b) => a.flatNumber.localeCompare(b.flatNumber)).map((flat) => (
                  <div key={flat._id} className={`card p-4 border-2 transition-all hover:shadow-card-hover ${flat.isOccupied ? "border-primary/20 bg-primary-50/30" : "border-gray-100"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xl font-extrabold text-gray-900">{flat.flatNumber}</p>
                        <p className="text-xs text-gray-500">{flat.ownershipType}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${flat.isOccupied ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"}`}>
                        {flat.isOccupied ? "Occupied" : "Vacant"}
                      </span>
                    </div>
                    {flat.members?.length > 0 && (
                      <button onClick={() => setViewMembers(flat)} className="flex items-center gap-1 text-xs text-secondary font-semibold hover:underline mb-3">
                        <Users size={12} /> {flat.members.length} member{flat.members.length !== 1 ? "s" : ""}
                      </button>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => setEditTarget(flat)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg flex-1 flex items-center justify-center transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(flat)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-1 flex items-center justify-center transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Flat">
        <FlatForm onSave={handleAdd} onCancel={() => setShowAdd(false)} loading={saving} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Flat">
        <FlatForm initial={editTarget} onSave={handleEdit} onCancel={() => setEditTarget(null)} loading={saving} />
      </Modal>
      <Modal open={!!viewMembers} onClose={() => setViewMembers(null)} title={`Flat ${viewMembers?.blockNumber}-${viewMembers?.flatNumber} Members`} maxWidth="max-w-sm">
        <div className="space-y-3">
          {viewMembers?.members?.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">No members assigned.</p>
            : viewMembers?.members?.map((m) => (
              <div key={m._id} className="flex items-center gap-3">
                <Avatar src={m.avatar?.url} name={m.name} size="sm" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{m.name}</p>
                  <Badge label={m.role} />
                </div>
              </div>
            ))}
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Flat" description={`Delete flat ${deleteTarget?.blockNumber}-${deleteTarget?.flatNumber}? Only empty flats can be deleted.`} loading={deleting} />
    </PageLayout>
  );
}

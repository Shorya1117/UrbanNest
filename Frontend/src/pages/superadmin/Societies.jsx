import { useEffect, useState, useCallback } from "react";
import { Plus, Building2, Pencil, Users, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { societyAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Input, Spinner, EmptyState, Modal, Badge } from "../../components/ui";

function SocietyForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(
    initial || {
      name: "",
      societyCode: "",
      address: { street: "", city: "", state: "", pincode: "", country: "India" },
      settings: {
        allowMarketplace: true,
        allowComplaints: true,
        allowServiceDirectory: true,
        requireApprovalForResidents: true,
      },
    }
  );

  const setAddr = (k, v) => setForm({ ...form, address: { ...form.address, [k]: v } });
  const setSet = (k, v) => setForm({ ...form, settings: { ...form.settings, [k]: v } });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.societyCode || !form.address.city)
      return toast.error("Name, code and city are required.");
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Society Name *" placeholder="Green Valley Heights" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Society Code *" placeholder="GVH001" value={form.societyCode}
          onChange={(e) => setForm({ ...form, societyCode: e.target.value.toUpperCase() })} />
      </div>

      <div className="space-y-1">
        <p className="label">Address</p>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Street / Area" value={form.address.street} onChange={(e) => setAddr("street", e.target.value)} />
          <Input placeholder="City *" value={form.address.city} onChange={(e) => setAddr("city", e.target.value)} />
          <Input placeholder="State" value={form.address.state} onChange={(e) => setAddr("state", e.target.value)} />
          <Input placeholder="Pincode" value={form.address.pincode} onChange={(e) => setAddr("pincode", e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="label">Module Settings</p>
        {[
          { key: "allowMarketplace", label: "Enable Marketplace" },
          { key: "allowComplaints", label: "Enable Complaints" },
          { key: "allowServiceDirectory", label: "Enable Service Directory" },
          { key: "requireApprovalForResidents", label: "Require Admin Approval for Residents" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-primary"
              checked={form.settings[key]}
              onChange={(e) => setSet(key, e.target.checked)} />
            <span className="text-sm text-gray-700 font-medium">{label}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">{initial ? "Save Changes" : "Create Society"}</Button>
      </div>
    </form>
  );
}

function AssignAdminModal({ society, open, onClose, onAssigned }) {
  const [form, setForm] = useState({ adminName: "", adminEmail: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.adminName || !form.adminEmail || !form.phone)
      return toast.error("All fields are required.");
    setLoading(true);
    try {
      const res = await societyAPI.assignAdmin(society._id, form);
      const { admin, tempPassword } = res.data.data;
      toast.success(`Admin assigned! Temp password: ${tempPassword}`, { duration: 8000 });
      onAssigned({ ...society, adminId: admin });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign admin.");
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign Admin — ${society?.name}`} maxWidth="max-w-md">
      {society?.adminId && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          This society already has an admin: <strong>{society.adminId.name || society.adminId.email}</strong>. Assigning a new one will replace them.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Admin Full Name *" placeholder="Rajesh Sharma" value={form.adminName}
          onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
        <Input label="Admin Email *" type="email" placeholder="secretary@society.com" value={form.adminEmail}
          onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
        <Input label="Phone *" placeholder="+91 9876543210" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
          A temporary password will be generated and shown once. The admin must change it on first login.
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">Assign Admin</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function SuperAdminSocieties() {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchSocieties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await societyAPI.getAll();
      setSocieties(res.data.data.societies);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSocieties(); }, [fetchSocieties]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const res = await societyAPI.create(form);
      setSocieties((prev) => [res.data.data.society, ...prev]);
      setShowAdd(false);
      toast.success("Society created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create.");
    } finally { setSaving(false); }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      const res = await societyAPI.update(editTarget._id, form);
      setSocieties((prev) => prev.map((s) => s._id === editTarget._id ? res.data.data.society : s));
      setEditTarget(null);
      toast.success("Society updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally { setSaving(false); }
  };

  const handleAssigned = (updated) =>
    setSocieties((prev) => prev.map((s) => s._id === updated._id ? updated : s));

  return (
    <PageLayout>
      <PageHeader
        title="Societies"
        description="Manage all registered societies on the platform"
        action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Create Society</Button>}
      />

      {loading ? <Spinner /> : societies.length === 0 ? (
        <EmptyState icon={Building2} title="No societies yet"
          description="Create your first society to get started."
          action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Create Society</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {societies.map((s) => (
            <div key={s._id} className="card border border-gray-100 hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {s.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <h3 className="font-extrabold text-gray-900 text-lg mb-0.5">{s.name}</h3>
              <p className="text-xs font-bold text-primary mb-1 tracking-wider">{s.societyCode}</p>
              <p className="text-xs text-gray-500 mb-4">{s.address?.city}, {s.address?.state}</p>

              <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl">
                <ShieldCheck size={14} className={s.adminId ? "text-primary" : "text-gray-400"} />
                <span className="text-xs text-gray-600">
                  {s.adminId
                    ? <><span className="font-bold text-gray-800">{s.adminId.name}</span> · {s.adminId.email}</>
                    : <span className="text-gray-400 italic">No admin assigned</span>}
                </span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1"
                  onClick={() => setAssignTarget(s)}>
                  <ShieldCheck size={13} /> {s.adminId ? "Reassign" : "Assign Admin"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditTarget(s)}>
                  <Pencil size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Society" maxWidth="max-w-xl">
        <SocietyForm onSave={handleCreate} onCancel={() => setShowAdd(false)} loading={saving} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Society" maxWidth="max-w-xl">
        <SocietyForm initial={editTarget} onSave={handleUpdate} onCancel={() => setEditTarget(null)} loading={saving} />
      </Modal>
      <AssignAdminModal
        society={assignTarget}
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={handleAssigned}
      />
    </PageLayout>
  );
}

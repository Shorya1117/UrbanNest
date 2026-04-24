import { useEffect, useState, useCallback } from "react";
import {
  Plus, Building2, Pencil, ShieldCheck, Copy, Eye, EyeOff, CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { societyAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Input, Spinner, EmptyState, Modal } from "../../components/ui";

// ─── Society Form ─────────────────────────────────────────────────────────────
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
  const setSet  = (k, v) => setForm({ ...form, settings: { ...form.settings, [k]: v } });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim())       return toast.error("Society name is required.");
    if (!form.societyCode.trim()) return toast.error("Society code is required.");
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

      <div className="space-y-2">
        <p className="label">Address</p>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Street / Area"   value={form.address.street}  onChange={(e) => setAddr("street",  e.target.value)} />
          <Input placeholder="City *"          value={form.address.city}    onChange={(e) => setAddr("city",    e.target.value)} />
          <Input placeholder="State"           value={form.address.state}   onChange={(e) => setAddr("state",   e.target.value)} />
          <Input placeholder="Pincode"         value={form.address.pincode} onChange={(e) => setAddr("pincode", e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="label">Module Settings</p>
        {[
          { key: "allowMarketplace",            label: "Enable Marketplace" },
          { key: "allowComplaints",              label: "Enable Complaints" },
          { key: "allowServiceDirectory",        label: "Enable Service Directory" },
          { key: "requireApprovalForResidents",  label: "Require Approval for Residents" },
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
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? "Save Changes" : "Create Society"}
        </Button>
      </div>
    </form>
  );
}

// ─── Assign Admin Modal ───────────────────────────────────────────────────────
function AssignAdminModal({ society, open, onClose, onAssigned }) {
  const [form, setForm] = useState({ adminName: "", adminEmail: "", phone: "" });
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null); // holds { tempPassword, loginUrl, admin }
  const [showPass, setShowPass]   = useState(false);
  const [copied, setCopied]       = useState(false);

  const handleClose = () => {
    setForm({ adminName: "", adminEmail: "", phone: "" });
    setResult(null);
    setShowPass(false);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.adminName || !form.adminEmail || !form.phone)
      return toast.error("All fields are required.");
    setLoading(true);
    try {
      const res = await societyAPI.assignAdmin(society._id, form);
      const data = res.data.data;
      setResult(data);
      onAssigned({ ...society, adminId: data.admin });
      toast.success("Admin assigned! Copy the credentials below.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign admin.");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const text =
      `UrbanNest Admin Credentials\n` +
      `Society: ${society?.name}\n` +
      `Login URL: ${result?.loginUrl}\n` +
      `Email: ${form.adminEmail}\n` +
      `Password: ${result?.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credentials copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  if (!society) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={result ? "Admin Credentials" : `Assign Admin — ${society.name}`}
      maxWidth="max-w-md"
    >
      {/* ── Success Screen: show credentials ── */}
      {result ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <CheckCircle className="text-green-600 shrink-0" size={22} />
            <div>
              <p className="text-sm font-bold text-green-800">Admin account created!</p>
              <p className="text-xs text-green-600 mt-0.5">
                Credentials emailed to <strong>{result.admin?.email}</strong>. Also copy them below as backup.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Login URL</p>
              <p className="text-sm font-bold text-gray-900 break-all">{result.loginUrl}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm font-bold text-gray-900">{result.admin?.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Temporary Password</p>
              <div className="flex items-center gap-2">
                <p className={`text-lg font-extrabold tracking-widest text-primary ${!showPass ? "blur-sm select-none" : ""}`}>
                  {result.tempPassword}
                </p>
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="pt-1">
              <p className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-lg p-2">
                ⚠️ Admin must change this password on first login. Share it securely.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={copyCredentials}
            >
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Credentials"}
            </Button>
            <Button className="flex-1" onClick={handleClose}>Done</Button>
          </div>
        </div>
      ) : (
        /* ── Form Screen ── */
        <>
          {society.adminId && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
              This society already has an admin: <strong>{society.adminId.name || society.adminId.email}</strong>.
              Assigning a new one will replace them.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Admin Full Name *" placeholder="Rajesh Sharma"
              value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
            <Input label="Admin Email *" type="email" placeholder="secretary@society.com"
              value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
            <Input label="Phone *" placeholder="+91 9876543210"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              A temporary password will be generated and emailed to the admin.
              It will also be shown here so you can share it manually if needed.
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={handleClose}>Cancel</Button>
              <Button type="submit" loading={loading} className="flex-1">Assign Admin</Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SuperAdminSocieties() {
  const [societies, setSocieties]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [saving, setSaving]         = useState(false);

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
        <EmptyState
          icon={Building2}
          title="No societies yet"
          description="Create your first society to get started."
          action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Create Society</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {societies.map((s) => (
            <div key={s._id} className="card border border-gray-100 hover:shadow-card-hover transition-all">
              {/* Header */}
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
              <p className="text-xs text-gray-500 mb-4">
                {[s.address?.city, s.address?.state].filter(Boolean).join(", ")}
              </p>

              {/* Admin info */}
              <div className="flex items-start gap-2 mb-4 p-3 bg-gray-50 rounded-xl">
                <ShieldCheck size={15} className={`mt-0.5 shrink-0 ${s.adminId ? "text-primary" : "text-gray-400"}`} />
                <div className="min-w-0">
                  {s.adminId ? (
                    <>
                      <p className="text-xs font-bold text-gray-900 truncate">{s.adminId.name}</p>
                      <p className="text-xs text-gray-500 truncate">{s.adminId.email}</p>
                      {s.adminId.phone && <p className="text-xs text-gray-400">{s.adminId.phone}</p>}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No admin assigned</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1"
                  onClick={() => setAssignTarget(s)}>
                  <ShieldCheck size={13} />
                  {s.adminId ? "Reassign Admin" : "Assign Admin"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditTarget(s)}>
                  <Pencil size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Society Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Society" maxWidth="max-w-xl">
        <SocietyForm onSave={handleCreate} onCancel={() => setShowAdd(false)} loading={saving} />
      </Modal>

      {/* Edit Society Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Society" maxWidth="max-w-xl">
        <SocietyForm initial={editTarget} onSave={handleUpdate} onCancel={() => setEditTarget(null)} loading={saving} />
      </Modal>

      {/* Assign Admin Modal */}
      <AssignAdminModal
        society={assignTarget}
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={handleAssigned}
      />
    </PageLayout>
  );
}


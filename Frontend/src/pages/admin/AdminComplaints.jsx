import { useEffect, useState, useCallback } from "react";
import { MessageSquare, ChevronDown, Phone, Star, Wrench, User, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { complaintAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Badge, Spinner, EmptyState, Modal, Textarea } from "../../components/ui";
import api from "../../api/axios";

const fetchProviders = (complaintId) =>
  api.get(`/complaints/${complaintId}/providers`);

// ─── Service Provider selector card ──────────────────────────────────────────
function ProviderCard({ provider, selected, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(selected ? "" : provider._id)}
      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
      style={{
        border: `2px solid ${selected ? "var(--emerald)" : "var(--border)"}`,
        background: selected ? "var(--emerald-glow)" : "var(--surface-2)",
      }}>
      <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {provider.photo?.url
          ? <img src={provider.photo.url} alt={provider.name} className="w-full h-full object-cover" />
          : <Wrench size={18} style={{ color: "var(--text-muted)" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {provider.name}
        </p>
        <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
          {provider.serviceType}
          {provider.averageRating > 0 && (
            <span className="ml-2 inline-flex items-center gap-0.5">
              <Star size={9} style={{ color: "#F59E0B", fill: "#F59E0B" }} />
              {provider.averageRating}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a href={`tel:${provider.phone}`} onClick={(e) => e.stopPropagation()}
          className="text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--emerald)" }}>
          <Phone size={11} /> {provider.phone}
        </a>
        {selected && (
          <div className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "var(--emerald)" }}>
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Complaint Row ────────────────────────────────────────────────────────────
function ComplaintRow({ complaint, onUpdate }) {
  const [expanded, setExpanded]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [providers, setProviders] = useState([]);
  const [suggestedType, setSuggestedType] = useState(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [form, setForm] = useState({
    status:         complaint.status,
    assignedTo:     complaint.assignedTo?._id || "",
    resolutionNote: complaint.resolutionNote || "",
  });
  const [saving, setSaving] = useState(false);

  const openModal = async () => {
    setShowModal(true);
    setProvidersLoading(true);
    try {
      const res = await fetchProviders(complaint._id);
      setProviders(res.data.data.providers || []);
      setSuggestedType(res.data.data.serviceType);
    } catch (e) {
      console.error("Failed to fetch providers:", e.message);
      setProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { status: form.status };
      if (form.assignedTo)     payload.assignedTo     = form.assignedTo;
      if (form.resolutionNote) payload.resolutionNote = form.resolutionNote;

      const res = await complaintAPI.updateStatus(complaint._id, payload);
      onUpdate(res.data.data.complaint);
      setShowModal(false);
      toast.success("Complaint updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const statusStyles = {
    PENDING:     { color: "#D97706", bg: "rgba(245,158,11,0.1)" },
    IN_PROGRESS: { color: "#2563EB", bg: "rgba(59,130,246,0.1)" },
    RESOLVED:    { color: "#059669", bg: "rgba(16,185,129,0.1)" },
  }[complaint.status] || {};

  return (
    <>
      <div className="card mb-3" style={{ padding: "16px 20px" }}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {complaint.title}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: statusStyles.bg, color: statusStyles.color }}>
                {complaint.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1">
                <User size={11} /> {complaint.createdBy?.name}
              </span>
              <span>
                {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
              {complaint.assignedTo && (
                <span className="flex items-center gap-1" style={{ color: "var(--emerald)" }}>
                  <Wrench size={11} /> {complaint.assignedTo.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="secondary" onClick={openModal}>Manage</Button>
            <button onClick={() => setExpanded(!expanded)}
              className="w-8 h-8 flex items-center justify-center rounded-lg btn-ghost">
              <ChevronDown size={15}
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {complaint.description}
            </p>
            {complaint.assignedTo && (
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--emerald-glow)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: "var(--surface)" }}>
                  {complaint.assignedTo.photo?.url
                    ? <img src={complaint.assignedTo.photo.url} alt="" className="w-full h-full object-cover" />
                    : <Wrench size={14} style={{ color: "var(--emerald)" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {complaint.assignedTo.name}
                  </p>
                  <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                    {complaint.assignedTo.serviceType}
                  </p>
                </div>
                {complaint.assignedTo.phone && (
                  <a href={`tel:${complaint.assignedTo.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: "var(--emerald)" }}>
                    <Phone size={12} /> Call
                  </a>
                )}
              </div>
            )}
            {complaint.resolutionNote && (
              <div className="p-3 rounded-xl text-xs"
                style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}>
                <strong>Resolution: </strong>{complaint.resolutionNote}
              </div>
            )}
            {complaint.images?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {complaint.images.map((img, i) => (
                  <a key={i} href={img.url} target="_blank" rel="noreferrer">
                    <img src={img.url} alt="" className="w-20 h-20 object-cover rounded-xl"
                      style={{ border: "1px solid var(--border)" }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Update Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Manage Complaint" maxWidth="max-w-lg">
        <form onSubmit={handleUpdate} className="space-y-5">

          {/* Status selector */}
          <div className="space-y-2">
            <label className="label">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {["PENDING", "IN_PROGRESS", "RESOLVED"].map((s) => {
                const styles = {
                  PENDING:     { color: "#D97706", bg: "rgba(245,158,11,0.12)" },
                  IN_PROGRESS: { color: "#2563EB", bg: "rgba(59,130,246,0.12)" },
                  RESOLVED:    { color: "#059669", bg: "rgba(16,185,129,0.12)" },
                }[s];
                return (
                  <button key={s} type="button"
                    onClick={() => setForm({ ...form, status: s })}
                    className="py-2 px-3 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: form.status === s ? styles.bg : "var(--surface-2)",
                      color: form.status === s ? styles.color : "var(--text-muted)",
                      border: `1.5px solid ${form.status === s ? styles.color : "var(--border)"}`,
                    }}>
                    {s.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service provider assignment */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="label mb-0">Assign Service Provider</label>
              {suggestedType && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{ background: "var(--emerald-glow)", color: "var(--emerald)" }}>
                  Suggested: {suggestedType}
                </span>
              )}
            </div>

            {providersLoading ? (
              <div className="flex items-center gap-2 p-4 text-sm" style={{ color: "var(--text-muted)" }}>
                <div className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderTopColor: "var(--emerald)", borderColor: "var(--border)" }} />
                Loading providers…
              </div>
            ) : providers.length === 0 ? (
              <div className="flex items-center gap-2 p-4 rounded-xl text-sm"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                <AlertCircle size={16} />
                No service providers found for this complaint type.
                Add providers first via the Services section.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {providers.map((p) => (
                  <ProviderCard key={p._id} provider={p}
                    selected={form.assignedTo === p._id}
                    onSelect={(id) => setForm({ ...form, assignedTo: id })} />
                ))}
              </div>
            )}
          </div>

          {/* Resolution note — shown when resolving */}
          {form.status === "RESOLVED" && (
            <Textarea label="Resolution Note"
              placeholder="Describe how the issue was resolved…"
              value={form.resolutionNote}
              onChange={(e) => setForm({ ...form, resolutionNote: e.target.value })}
              rows={3} />
          )}

          <div className="flex gap-3">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState("");

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      const res = await complaintAPI.getAll(params);
      setComplaints(res.data.data.complaints);
    } catch {}
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleUpdate = (updated) =>
    setComplaints((prev) => prev.map((c) => c._id === updated._id ? updated : c));

  return (
    <PageLayout>
      <PageHeader
        title="Complaints"
        description="Manage and assign service providers to resolve complaints"
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "PENDING", "IN_PROGRESS", "RESOLVED"].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: status === s ? "var(--emerald)" : "var(--surface)",
              color: status === s ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${status === s ? "var(--emerald)" : "var(--border)"}`,
            }}>
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : complaints.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No complaints"
          description="No complaints match the current filter." />
      ) : (
        <div>{complaints.map((c) => <ComplaintRow key={c._id} complaint={c} onUpdate={handleUpdate} />)}</div>
      )}
    </PageLayout>
  );
}
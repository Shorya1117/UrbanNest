import { useEffect, useState, useCallback } from "react";
import { Plus, MessageSquare, ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, Wrench, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { complaintAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Spinner, EmptyState, Modal } from "../../components/ui";

const STATUS_CONFIG = {
  PENDING:     { label: "Pending",     color: "#D97706", bg: "rgba(245,158,11,0.1)",  icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "#2563EB", bg: "rgba(59,130,246,0.1)",  icon: AlertCircle },
  RESOLVED:    { label: "Resolved",    color: "#059669", bg: "rgba(16,185,129,0.1)", icon: CheckCircle },
};

function ComplaintCard({ complaint }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;

  return (
    <div className="card mb-3 animate-fade-in" style={{ padding: "0" }}>
      <button className="w-full flex items-start gap-4 p-5 text-left"
        onClick={() => setOpen(!open)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: cfg.bg }}>
          <Icon size={18} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {complaint.title}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            {complaint.assignedTo && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Wrench size={10} /> Assigned: {complaint.assignedTo.name}
              </span>
            )}
          </p>
        </div>
        <div className="shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 animate-fade-in" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-sm leading-relaxed pt-4" style={{ color: "var(--text-secondary)" }}>
            {complaint.description}
          </p>

          {/* Assigned provider */}
          {complaint.assignedTo && (
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--emerald-glow)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0"
                style={{ background: "var(--surface)" }}>
                {complaint.assignedTo.photo?.url
                  ? <img src={complaint.assignedTo.photo.url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Wrench size={14} style={{ color: "var(--emerald)" }} />
                    </div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  {complaint.assignedTo.name}
                </p>
                <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                  {complaint.assignedTo.serviceType}
                </p>
              </div>
              {complaint.assignedTo.phone && (
                <a href={`tel:${complaint.assignedTo.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "var(--emerald)", color: "#fff" }}>
                  <Phone size={12} /> Call
                </a>
              )}
            </div>
          )}

          {/* Resolution note */}
          {complaint.resolutionNote && (
            <div className="p-3 rounded-xl text-xs leading-relaxed"
              style={{ background: "rgba(16,185,129,0.08)", color: "#059669", border: "1px solid rgba(16,185,129,0.15)" }}>
              <strong>Resolution: </strong>{complaint.resolutionNote}
            </div>
          )}

          {/* Images */}
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
  );
}

function CreateComplaintModal({ open, onClose, onCreated }) {
  const [form, setForm]   = useState({ title: "", description: "" });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [suggested, setSuggested] = useState(null); // { serviceType, providers }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim())       errs.title       = "Title is required.";
    if (!form.description.trim()) errs.description = "Description is required.";
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({}); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title",       form.title);
      fd.append("description", form.description);
      files.forEach((f) => fd.append("images", f));
      const res = await complaintAPI.create(fd);
      const { complaint, suggestedServiceType, suggestedProviders } = res.data.data;
      if (suggestedServiceType && suggestedProviders?.length) {
        setSuggested({ serviceType: suggestedServiceType, providers: suggestedProviders });
      }
      toast.success("Complaint submitted!");
      onCreated(complaint);
      setForm({ title: "", description: "" });
      setFiles([]);
      if (!suggestedServiceType) onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit.");
    } finally { setLoading(false); }
  };

  const handleClose = () => {
    setForm({ title: "", description: "" });
    setFiles([]); setErrors({}); setSuggested(null); onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={suggested ? "Suggested Service Providers" : "Raise a Complaint"} maxWidth="max-w-lg">
      {suggested ? (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl" style={{ background: "var(--emerald-glow)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--emerald)" }}>
              Your complaint has been submitted! ✓
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Based on your complaint, we suggest contacting a <strong>{suggested.serviceType}</strong>:
            </p>
          </div>
          <div className="space-y-2">
            {suggested.providers.map((p) => (
              <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                  style={{ background: "var(--surface)" }}>
                  {p.photo?.url
                    ? <img src={p.photo.url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Wrench size={16} style={{ color: "var(--text-muted)" }} />
                      </div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                  <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{p.serviceType}</p>
                </div>
                <a href={`tel:${p.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
                  style={{ background: "var(--emerald)", color: "#fff" }}>
                  <Phone size={12} /> {p.phone}
                </a>
              </div>
            ))}
          </div>
          <Button className="w-full" onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Title *</label>
            <input className={`input ${errors.title ? "input-error" : ""}`}
              placeholder="e.g. Water leakage in corridor"
              value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: "" }); }} />
            {errors.title && <p className="text-xs" style={{ color: "#EF4444" }}>{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="label">Description *</label>
            <textarea rows={4} className={`input resize-none ${errors.description ? "input-error" : ""}`}
              placeholder="Describe the issue in detail..."
              value={form.description}
              onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: "" }); }} />
            {errors.description && <p className="text-xs" style={{ color: "#EF4444" }}>{errors.description}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="label">Attach Photos (up to 3)</label>
            <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors"
              style={{ border: "2px dashed var(--border)", background: "var(--surface-2)" }}>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 3))} />
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                {files.length > 0 ? `${files.length} file(s) selected` : "Click to attach images"}
              </div>
            </label>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Submit Complaint</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState("");
  const [showModal, setShowModal]   = useState(false);

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

  const tabs = ["", "PENDING", "IN_PROGRESS", "RESOLVED"];

  return (
    <PageLayout>
      <PageHeader
        title="My Complaints"
        description="Track and raise issues in your society"
        action={<Button onClick={() => setShowModal(true)}><Plus size={15} /> Raise Complaint</Button>}
      />

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((s) => (
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
          description="Raise a complaint if you notice any issues in your society."
          action={<Button onClick={() => setShowModal(true)}><Plus size={15} /> Raise Complaint</Button>} />
      ) : (
        <div>{complaints.map((c) => <ComplaintCard key={c._id} complaint={c} />)}</div>
      )}

      <CreateComplaintModal open={showModal} onClose={() => setShowModal(false)}
        onCreated={(c) => setComplaints((prev) => [c, ...prev])} />
    </PageLayout>
  );
}
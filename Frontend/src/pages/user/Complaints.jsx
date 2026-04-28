import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, MessageSquare, ChevronDown, ChevronUp, Clock, CheckCircle, Wrench, Phone, Upload, X, Zap, Droplets,
  Trash2, Shield, Trees, Car, Wifi, Package,
  AlertTriangle, AlertCircle, Info, Camera, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { complaintAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Badge, Spinner, EmptyState, Modal, Input, Textarea } from "../../components/ui";

function ComplaintCard({ complaint }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;

  return (
    <div className="card border border-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm">{complaint.title}</h3>
            <Badge label={complaint.status} />
          </div>
          <p className="text-xs text-gray-500">{new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="px-5 pb-5 space-y-4 animate-fade-in" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-sm leading-relaxed pt-4" style={{ color: "var(--text-secondary)" }}>
            {complaint.description}
          </p>

          {/* Assigned provider */}
          {complaint.assignedTo && (
            <p className="text-xs text-gray-500">Assigned to: <span className="font-semibold text-gray-700">{complaint.assignedTo.name}</span></p>
          )}
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

// ─── Image Upload Area ────────────────────────────────────────────────────────
function ImageUploadArea({ files, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (incoming) => {
    const valid = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    const merged = [...files, ...valid].slice(0, 3);
    onChange(merged);
  };

  const removeFile = (idx) => {
    const updated = files.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const previews = files.map((f) => URL.createObjectURL(f));

  return (
    <div className="space-y-2">
      <label className="label flex items-center gap-1.5">
        <Camera size={14} className="text-gray-400" />
        Attach Photos <span className="text-gray-400 font-normal">(up to 3 images)</span>
      </label>

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {previews.map((src, i) => (
            <div key={i} className="relative group">
              <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {files.length < 3 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              <Plus size={18} />
              <span className="text-xs mt-0.5">Add</span>
            </button>
          )}
        </div>
      )}

      {/* Drop zone (only shown when no files) */}
      {files.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
            ${dragging ? "border-primary bg-primary-50" : "border-gray-300 hover:border-primary hover:bg-gray-50"}`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dragging ? "bg-primary-100" : "bg-gray-100"}`}>
            <Upload size={18} className={dragging ? "text-primary" : "text-gray-400"} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Drop photos here or <span className="text-primary">browse</span></p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP — up to 3 photos</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ["Category", "Details", "Priority & Photos"];
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center gap-1.5 ${active ? "opacity-100" : done ? "opacity-80" : "opacity-40"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${done ? "bg-green-500 text-white" : active ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
                {done ? <CheckCircle2 size={12} /> : idx}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap hidden sm:block ${active ? "text-primary" : "text-gray-500"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px mx-1 ${step > idx ? "bg-green-400" : "bg-gray-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Create Complaint Modal ───────────────────────────────────────────────────
function CreateComplaintModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", description: "" });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [suggested, setSuggested] = useState(null); // { serviceType, providers }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error("Please fill all required fields.");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title",       form.title);
      fd.append("description", form.description);
      if (form.category) fd.append("category", form.category);
      if (form.priority) fd.append("priority", form.priority);
      if (form.flatNo) fd.append("flatNo", form.flatNo);
      if (form.block) fd.append("block", form.block);
      files.forEach((f) => fd.append("images", f));
      const res = await complaintAPI.create(fd);
      toast.success("Complaint submitted!");
      onCreated(res.data.data.complaint);
      onClose();
      setForm({ title: "", description: "" });
      setFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit complaint.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ title: "", description: "" });
    setFiles([]); setErrors({}); setSuggested(null); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Raise a Complaint" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title *" placeholder="e.g. Water leakage in corridor" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea label="Description *" placeholder="Describe the issue in detail..."
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} />
        <div className="space-y-1.5">
          <label className="label">Attach Images (up to 3)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 3))}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100" />
          {files.length > 0 && <p className="text-xs text-gray-500">{files.length} file(s) selected</p>}
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">Submit Complaint</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
    } catch { } finally { setLoading(false); }
  }, [status]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const tabs = ["", "PENDING", "IN_PROGRESS", "RESOLVED"];

  return (
    <PageLayout>
      <PageHeader
        title="My Complaints"
        description="Track and raise issues in your society"
        action={<Button onClick={() => setShowModal(true)}><Plus size={16} /> Raise Complaint</Button>}
      />

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statusTabs.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${status === s ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : complaints.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No complaints found"
          description="Raise a complaint if you notice any issues in your society."
          action={<Button onClick={() => setShowModal(true)}><Plus size={16} /> Raise Complaint</Button>} />
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => <ComplaintCard key={c._id} complaint={c} />)}
        </div>
      )}

      <CreateComplaintModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(c) => setComplaints((prev) => [c, ...prev])}
      />
    </PageLayout>
  );
}
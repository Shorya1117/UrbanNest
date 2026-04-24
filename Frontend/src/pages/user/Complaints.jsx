import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, MessageSquare, ChevronDown, Upload, X, Zap, Droplets,
  Trash2, Shield, Wrench, Trees, Car, Wifi, Package,
  AlertTriangle, AlertCircle, Info, Camera, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { complaintAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Badge, Spinner, EmptyState, Modal } from "../../components/ui";

// ─── Society Problem Categories ──────────────────────────────────────────────
const PROBLEM_CATEGORIES = [
  { id: "electricity", label: "Electricity", icon: Zap, color: "bg-yellow-50 border-yellow-200 text-yellow-700", activeColor: "bg-yellow-500 text-white border-yellow-500", desc: "Power cuts, wiring, street lights" },
  { id: "water", label: "Water Supply", icon: Droplets, color: "bg-blue-50 border-blue-200 text-blue-700", activeColor: "bg-blue-500 text-white border-blue-500", desc: "Leakage, low pressure, no supply" },
  { id: "washroom", label: "Washroom", icon: Wrench, color: "bg-purple-50 border-purple-200 text-purple-700", activeColor: "bg-purple-500 text-white border-purple-500", desc: "Plumbing, cleanliness issues" },
  { id: "garbage", label: "Garbage / Waste", icon: Trash2, color: "bg-green-50 border-green-200 text-green-700", activeColor: "bg-green-500 text-white border-green-500", desc: "Waste disposal, bin overflow" },
  { id: "security", label: "Security", icon: Shield, color: "bg-red-50 border-red-200 text-red-700", activeColor: "bg-red-500 text-white border-red-500", desc: "Gate, guards, CCTV issues" },
  { id: "maintenance", label: "Maintenance", icon: Wrench, color: "bg-orange-50 border-orange-200 text-orange-700", activeColor: "bg-orange-500 text-white border-orange-500", desc: "Building repairs, lifts, walls" },
  { id: "garden", label: "Garden / Parks", icon: Trees, color: "bg-emerald-50 border-emerald-200 text-emerald-700", activeColor: "bg-emerald-500 text-white border-emerald-500", desc: "Lawn, plants, pathways" },
  { id: "parking", label: "Parking", icon: Car, color: "bg-slate-50 border-slate-200 text-slate-700", activeColor: "bg-slate-600 text-white border-slate-600", desc: "Blocked, unauthorized parking" },
  { id: "internet", label: "Internet / Cable", icon: Wifi, color: "bg-indigo-50 border-indigo-200 text-indigo-700", activeColor: "bg-indigo-500 text-white border-indigo-500", desc: "Connectivity, DTH, cable issues" },
  { id: "other", label: "Other", icon: Package, color: "bg-gray-50 border-gray-200 text-gray-700", activeColor: "bg-gray-600 text-white border-gray-600", desc: "Any other society issue" },
];

// ─── Priority Config ──────────────────────────────────────────────────────────
const PRIORITY_LEVELS = [
  {
    id: "low",
    label: "Low",
    icon: Info,
    description: "Minor inconvenience, not urgent",
    color: "border-green-200 bg-green-50 text-green-700",
    activeColor: "border-green-500 bg-green-500 text-white",
    dot: "bg-green-500",
  },
  {
    id: "medium",
    label: "Medium",
    icon: AlertCircle,
    description: "Needs attention within a few days",
    color: "border-amber-200 bg-amber-50 text-amber-700",
    activeColor: "border-amber-500 bg-amber-500 text-white",
    dot: "bg-amber-500",
  },
  {
    id: "high",
    label: "High",
    icon: AlertTriangle,
    description: "Urgent — requires immediate action",
    color: "border-red-200 bg-red-50 text-red-700",
    activeColor: "border-red-500 bg-red-500 text-white",
    dot: "bg-red-500",
  },
];

// ─── Block Options ────────────────────────────────────────────────────────────
const BLOCKS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// ─── Priority Badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  if (!priority) return null;
  const cfg = PRIORITY_LEVELS.find((p) => p.id === priority);
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────
function CategoryBadge({ categoryId }) {
  const cat = PROBLEM_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;
  const Icon = cat.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cat.color}`}>
      <Icon size={10} />
      {cat.label}
    </span>
  );
}

// ─── Complaint Card ───────────────────────────────────────────────────────────
function ComplaintCard({ complaint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card border border-gray-100 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm">{complaint.title}</h3>
            <Badge label={complaint.status} />
            {complaint.priority && <PriorityBadge priority={complaint.priority} />}
            {complaint.category && <CategoryBadge categoryId={complaint.category} />}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-gray-500">
              {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            {complaint.flatNo && (
              <span className="text-xs text-gray-500 font-medium">
                Flat {complaint.flatNo}
                {complaint.block ? ` • Block ${complaint.block}` : ""}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-700 transition-colors mt-0.5">
          <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">{complaint.description}</p>
          {complaint.assignedTo && (
            <p className="text-xs text-gray-500">
              Assigned to: <span className="font-semibold text-gray-700">{complaint.assignedTo.name}</span>
            </p>
          )}
          {complaint.resolutionNote && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <span className="font-semibold">Resolution: </span>{complaint.resolutionNote}
            </div>
          )}
          {complaint.images?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {complaint.images.map((img, i) => (
                <a key={i} href={img.url} target="_blank" rel="noreferrer">
                  <img src={img.url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition-opacity" />
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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    flatNo: "",
    block: "",
    priority: "medium",
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep(1);
    setForm({ category: "", title: "", description: "", flatNo: "", block: "", priority: "medium" });
    setFiles([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const selectedCat = PROBLEM_CATEGORIES.find((c) => c.id === form.category);

  const handleSubmit = async () => {
    if (!form.title || !form.description) return toast.error("Please fill all required fields.");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      if (form.category) fd.append("category", form.category);
      if (form.priority) fd.append("priority", form.priority);
      if (form.flatNo) fd.append("flatNo", form.flatNo);
      if (form.block) fd.append("block", form.block);
      files.forEach((f) => fd.append("images", f));
      const res = await complaintAPI.create(fd);
      toast.success("Complaint submitted successfully!");
      onCreated(res.data.data.complaint);
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Raise a Complaint" maxWidth="max-w-2xl">
      <StepIndicator step={step} />

      {/* ── STEP 1: Category ── */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 -mt-2">Select the type of problem you're facing in your society.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PROBLEM_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = form.category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.id })}
                  className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all duration-150
                    ${active ? cat.activeColor : cat.color + " hover:opacity-80"}`}
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <Icon size={16} />
                    <span className="text-xs font-bold">{cat.label}</span>
                    {active && <CheckCircle2 size={12} className="ml-auto" />}
                  </div>
                  <span className={`text-xs leading-tight ${active ? "opacity-80" : "opacity-60"}`}>{cat.desc}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              disabled={!form.category}
              onClick={() => setStep(2)}
            >
              Continue →
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Details ── */}
      {step === 2 && (
        <div className="space-y-4">
          {selectedCat && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${selectedCat.color}`}>
              {(() => { const Icon = selectedCat.icon; return <Icon size={15} />; })()}
              {selectedCat.label}
              <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs underline font-normal opacity-70 hover:opacity-100">Change</button>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="label">Complaint Title *</label>
            <input
              className="input"
              placeholder={selectedCat ? `e.g. ${selectedCat.desc.split(",")[0]} problem` : "Brief title of the issue"}
              value={form.title}
              maxLength={150}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <p className="text-xs text-gray-400 text-right">{form.title.length}/150</p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="label">Description *</label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="Describe the issue clearly — when it started, how often it happens, impact on residents..."
              value={form.description}
              maxLength={2000}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <p className="text-xs text-gray-400 text-right">{form.description.length}/2000</p>
          </div>

          {/* Flat No + Block */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="label">Flat Number</label>
              <input
                className="input"
                placeholder="e.g. 101, 204B"
                value={form.flatNo}
                onChange={(e) => setForm({ ...form, flatNo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="label">Block / Tower</label>
              <select
                className="input"
                value={form.block}
                onChange={(e) => setForm({ ...form, block: e.target.value })}
              >
                <option value="">Select Block</option>
                {BLOCKS.map((b) => (
                  <option key={b} value={b}>Block {b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">← Back</Button>
            <Button
              disabled={!form.title || !form.description}
              onClick={() => setStep(3)}
              className="flex-1"
            >
              Continue →
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Priority + Photos ── */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Priority */}
          <div className="space-y-2">
            <label className="label">Problem Severity / Priority *</label>
            <div className="grid grid-cols-3 gap-2.5">
              {PRIORITY_LEVELS.map((p) => {
                const Icon = p.icon;
                const active = form.priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p.id })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 text-center
                      ${active ? p.activeColor : p.color + " hover:opacity-80"}`}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-bold">{p.label}</span>
                    <span className={`text-xs leading-tight ${active ? "opacity-80" : "opacity-60"}`}>{p.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo upload */}
          <ImageUploadArea files={files} onChange={setFiles} />

          {/* Summary */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Review Summary</p>
            <div className="flex flex-wrap gap-2">
              {selectedCat && <CategoryBadge categoryId={form.category} />}
              <PriorityBadge priority={form.priority} />
              {form.flatNo && (
                <span className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                  Flat {form.flatNo}{form.block ? ` • Block ${form.block}` : ""}
                </span>
              )}
              {files.length > 0 && (
                <span className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                  📷 {files.length} photo{files.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 font-medium truncate">{form.title}</p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">← Back</Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">Submit Complaint</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      const res = await complaintAPI.getAll(params);
      setComplaints(res.data.data.complaints);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const statusTabs = ["", "PENDING", "IN_PROGRESS", "RESOLVED"];

  return (
    <PageLayout>
      <PageHeader
        title="My Complaints"
        description="Track and raise issues in your society"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Raise Complaint
          </Button>
        }
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {statusTabs.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all
              ${status === s
                ? "bg-primary text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary"
              }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No complaints found"
          description="Raise a complaint if you notice any issues in your society."
          action={
            <Button onClick={() => setShowModal(true)}>
              <Plus size={16} /> Raise Complaint
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))}
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
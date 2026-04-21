import { useEffect, useState, useCallback } from "react";
import { Plus, MessageSquare, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { complaintAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Badge, Spinner, EmptyState, Modal, Input, Textarea } from "../../components/ui";

function ComplaintCard({ complaint }) {
  const [open, setOpen] = useState(false);
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
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">{complaint.description}</p>
          {complaint.assignedTo && (
            <p className="text-xs text-gray-500">Assigned to: <span className="font-semibold text-gray-700">{complaint.assignedTo.name}</span></p>
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

function CreateComplaintModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", description: "" });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error("Please fill all required fields.");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      files.forEach((f) => fd.append("images", f));
      const res = await complaintAPI.create(fd);
      toast.success("Complaint submitted!");
      onCreated(res.data.data.complaint);
      onClose();
      setForm({ title: "", description: "" });
      setFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit.");
    } finally { setLoading(false); }
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
    } catch { } finally { setLoading(false); }
  }, [status]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const statusTabs = ["", "PENDING", "IN_PROGRESS", "RESOLVED"];

  return (
    <PageLayout>
      <PageHeader
        title="My Complaints"
        description="Track and raise issues in your society"
        action={<Button onClick={() => setShowModal(true)}><Plus size={16} /> Raise Complaint</Button>}
      />

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

      <CreateComplaintModal open={showModal} onClose={() => setShowModal(false)}
        onCreated={(c) => setComplaints((prev) => [c, ...prev])} />
    </PageLayout>
  );
}

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { complaintAPI, userAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Badge, Spinner, EmptyState, Modal, Select, Textarea } from "../../components/ui";

function ComplaintRow({ complaint, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ status: complaint.status, resolutionNote: complaint.resolutionNote || "", assignedTo: complaint.assignedTo?._id || "" });
  const [admins, setAdmins] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    if (admins.length) return;
    try {
      const res = await userAPI.getAll({ role: "ADMIN" });
      setAdmins(res.data.data.residents);
    } catch { }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await complaintAPI.updateStatus(complaint._id, form);
      onUpdate(res.data.data.complaint);
      setShowModal(false);
      toast.success("Complaint updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="card border border-gray-100 transition-all">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm">{complaint.title}</h3>
              <Badge label={complaint.status} />
            </div>
            <p className="text-xs text-gray-500">
              By <span className="font-semibold text-gray-700">{complaint.createdBy?.name}</span> ·{" "}
              {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="secondary" onClick={() => { setShowModal(true); fetchAdmins(); }}>Update</Button>
            <button onClick={() => setOpen(!open)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">{complaint.description}</p>
            {complaint.assignedTo && (
              <p className="text-xs text-gray-500">Assigned to: <span className="font-semibold text-gray-700">{complaint.assignedTo.name}</span></p>
            )}
            {complaint.resolutionNote && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                <span className="font-semibold">Resolution note: </span>{complaint.resolutionNote}
              </div>
            )}
            {complaint.images?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {complaint.images.map((img, i) => (
                  <a key={i} href={img.url} target="_blank" rel="noreferrer">
                    <img src={img.url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Update Complaint" maxWidth="max-w-md">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {["PENDING", "IN_PROGRESS", "RESOLVED"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </Select>
          {admins.length > 0 && (
            <Select label="Assign To" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Not assigned</option>
              {admins.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </Select>
          )}
          {form.status === "RESOLVED" && (
            <Textarea label="Resolution Note" placeholder="Describe how the issue was resolved..."
              value={form.resolutionNote} onChange={(e) => setForm({ ...form, resolutionNote: e.target.value })} rows={3} />
          )}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

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

  const handleUpdate = (updated) =>
    setComplaints((prev) => prev.map((c) => c._id === updated._id ? updated : c));

  const statusTabs = ["", "PENDING", "IN_PROGRESS", "RESOLVED"];

  return (
    <PageLayout>
      <PageHeader title="Manage Complaints" description="Review and resolve resident complaints" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {statusTabs.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${status === s ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : complaints.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No complaints found" description="No complaints match your current filter." />
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => <ComplaintRow key={c._id} complaint={c} onUpdate={handleUpdate} />)}
        </div>
      )}
    </PageLayout>
  );
}

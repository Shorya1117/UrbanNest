import { useEffect, useState, useCallback } from "react";
import { CalendarCheck, Clock, CheckCircle, XCircle, User, Phone, Wrench, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { bookingAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Spinner, EmptyState, Badge, Modal, Textarea } from "../../components/ui";

const TIME_LABELS = { MORNING: "Morning (8–12)", AFTERNOON: "Afternoon (12–5)", EVENING: "Evening (5–9)" };
const STATUSES = ["", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

function StatusUpdateModal({ open, onClose, booking, onSave }) {
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      setStatus("");
      setAdminNotes(booking.adminNotes || "");
    }
  }, [booking]);

  const validNext = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["COMPLETED", "CANCELLED"],
  };

  const allowed = booking ? validNext[booking.status] || [] : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status) return toast.error("Select a status.");
    setLoading(true);
    try {
      const res = await bookingAPI.updateStatus(booking._id, { status, adminNotes });
      onSave(res.data.data.booking);
      toast.success(`Booking ${status.toLowerCase()}.`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update.");
    } finally { setLoading(false); }
  };

  if (!booking) return null;
  return (
    <Modal open={open} onClose={onClose} title="Update Booking Status">
      <div className="space-y-4 mb-5">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-bold text-gray-900">{booking.serviceId?.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            Booked by: {booking.userId?.name || "Unknown"} • {new Date(booking.date).toLocaleDateString("en-IN")} • {TIME_LABELS[booking.timeSlot]}
          </p>
          <div className="mt-2"><Badge label={booking.status} /></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="label">New Status *</label>
          <div className="flex gap-2">
            {allowed.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  status === s
                    ? s === "CANCELLED" ? "bg-red-500 text-white border-red-500" : "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {s === "CONFIRMED" && <CheckCircle size={14} />}
                {s === "COMPLETED" && <CheckCircle size={14} />}
                {s === "CANCELLED" && <XCircle size={14} />}
                {s}
              </button>
            ))}
          </div>
          {allowed.length === 0 && (
            <p className="text-sm text-gray-400">This booking cannot be updated further.</p>
          )}
        </div>
        <Textarea
          label="Admin Notes (optional)"
          placeholder="Add a note for the resident..."
          value={adminNotes}
          rows={3}
          onChange={(e) => setAdminNotes(e.target.value)}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} disabled={!status} className="flex-1">Update</Button>
        </div>
      </form>
    </Modal>
  );
}

function BookingRow({ booking, onUpdate }) {
  const service = booking.serviceId;
  const user = booking.userId;

  return (
    <div className="card border border-gray-100 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 overflow-hidden">
            {service?.photo?.url
              ? <img src={service.photo.url} alt={service.name} className="w-full h-full object-cover" />
              : <Wrench className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{service?.name || "—"}</h3>
            <span className="text-xs text-gray-500 capitalize">{service?.serviceType}</span>
          </div>
        </div>
        <Badge label={booking.status} />
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User size={13} className="text-gray-400" />
          <span className="font-semibold">{user?.name || "Unknown"}</span>
          <span className="text-gray-400">•</span>
          <span className="text-xs text-gray-500">{user?.email}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5"><CalendarCheck size={13} className="text-primary" />
            {new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span className="flex items-center gap-1.5"><Clock size={13} className="text-primary" />
            {TIME_LABELS[booking.timeSlot]}
          </span>
        </div>
        {user?.phone && (
          <a href={`tel:${user.phone}`} className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
            <Phone size={13} /> {user.phone}
          </a>
        )}
      </div>

      {booking.notes && (
        <p className="text-xs text-gray-500 mb-2"><span className="font-semibold">User notes:</span> {booking.notes}</p>
      )}
      {booking.adminNotes && (
        <p className="text-xs text-blue-600 mb-2"><span className="font-semibold">Admin notes:</span> {booking.adminNotes}</p>
      )}

      {!["COMPLETED", "CANCELLED"].includes(booking.status) && (
        <div className="pt-2 border-t border-gray-50">
          <Button size="sm" onClick={() => onUpdate(booking)}>Update Status</Button>
        </div>
      )}
    </div>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [updateTarget, setUpdateTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const [bRes, sRes] = await Promise.all([bookingAPI.getAll(params), bookingAPI.getStats()]);
      setBookings(bRes.data.data.bookings);
      setStats(sRes.data.data.stats);
    } catch { } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = (updated) => {
    setBookings((prev) => prev.map((b) => b._id === updated._id ? { ...updated } : b));
    setUpdateTarget(null);
    fetchData();
  };

  const statCards = [
    { label: "Pending", value: stats.PENDING, color: "text-yellow-600 bg-yellow-50" },
    { label: "Confirmed", value: stats.CONFIRMED, color: "text-blue-600 bg-blue-50" },
    { label: "Completed", value: stats.COMPLETED, color: "text-green-600 bg-green-50" },
    { label: "Cancelled", value: stats.CANCELLED, color: "text-red-600 bg-red-50" },
  ];

  return (
    <PageLayout>
      <PageHeader title="Service Bookings" description="Manage all service bookings in your society" />

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-sm font-semibold opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <Filter size={16} className="text-gray-400" />
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              statusFilter === s
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings found"
          description={statusFilter ? "No bookings with this status." : "No service bookings yet."}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookings.map((b) => (
            <BookingRow key={b._id} booking={b} onUpdate={setUpdateTarget} />
          ))}
        </div>
      )}

      <StatusUpdateModal
        open={!!updateTarget}
        onClose={() => setUpdateTarget(null)}
        booking={updateTarget}
        onSave={handleSave}
      />
    </PageLayout>
  );
}
import { useEffect, useState, useCallback } from "react";
import { CalendarCheck, Clock, Phone, Wrench, X, Star } from "lucide-react";
import toast from "react-hot-toast";
import { bookingAPI, reviewAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Spinner, EmptyState, Badge, Modal, StarRating, Textarea } from "../../components/ui";

const TIME_LABELS = { MORNING: "Morning (8–12)", AFTERNOON: "Afternoon (12–5)", EVENING: "Evening (5–9)" };
const STATUSES = ["", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

function ReviewModal({ open, onClose, booking }) {
  const [form, setForm] = useState({ rating: 0, comment: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating) return toast.error("Please select a rating.");
    setSubmitting(true);
    try {
      await reviewAPI.add({
        ...form,
        targetType: "SERVICE",
        serviceId: booking.serviceId?._id,
      });
      toast.success("Review submitted! Thank you.");
      onClose(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;
  return (
    <Modal open={open} onClose={() => onClose(false)} title={`Review — ${booking.serviceId?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3">How was your experience?</p>
          <StarRating value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
        </div>
        <Textarea
          placeholder="Share your experience..."
          value={form.comment}
          rows={3}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
        />
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={() => onClose(false)} className="flex-1">Cancel</Button>
          <Button type="submit" loading={submitting} className="flex-1">Submit Review</Button>
        </div>
      </form>
    </Modal>
  );
}

function BookingCard({ booking, onCancel, onReview }) {
  const service = booking.serviceId;
  const isPast = ["COMPLETED", "CANCELLED"].includes(booking.status);

  return (
    <div className="card border border-gray-100 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 overflow-hidden">
            {service?.photo?.url
              ? <img src={service.photo.url} alt={service.name} className="w-full h-full object-cover" />
              : <Wrench className="w-6 h-6 text-primary" />}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{service?.name || "Unknown Service"}</h3>
            <span className="text-xs text-gray-500 capitalize">{service?.serviceType}</span>
          </div>
        </div>
        <Badge label={booking.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarCheck size={14} className="text-primary" />
          {new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={14} className="text-primary" />
          {TIME_LABELS[booking.timeSlot] || booking.timeSlot}
        </div>
      </div>

      {booking.notes && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-3">
          <span className="font-semibold">Notes:</span> {booking.notes}
        </p>
      )}

      {booking.adminNotes && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2 mb-3">
          <span className="font-semibold">Admin:</span> {booking.adminNotes}
        </p>
      )}

      {service?.phone && (
        <a href={`tel:${service.phone}`} className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mb-3">
          <Phone size={13} /> {service.phone}
        </a>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-50">
        {!isPast && (
          <Button size="sm" variant="danger" onClick={() => onCancel(booking)}>
            <X size={13} /> Cancel
          </Button>
        )}
        {booking.status === "COMPLETED" && (
          <Button size="sm" variant="secondary" onClick={() => onReview(booking)}>
            <Star size={13} /> Leave Review
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await bookingAPI.getMy(params);
      setBookings(res.data.data.bookings);
    } catch { } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (booking) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(booking._id);
    try {
      await bookingAPI.cancel(booking._id);
      setBookings((prev) => prev.map((b) => b._id === booking._id ? { ...b, status: "CANCELLED" } : b));
      toast.success("Booking cancelled.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel.");
    } finally { setCancelling(null); }
  };

  const handleReviewClose = (submitted) => {
    setReviewTarget(null);
    if (submitted) fetchBookings();
  };

  return (
    <PageLayout>
      <PageHeader title="My Bookings" description="Track and manage your service bookings" />

      <div className="flex gap-2 mb-6 flex-wrap">
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
          description={statusFilter ? "No bookings with this status." : "You haven't booked any services yet. Go to Services to book one!"}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookings.map((b) => (
            <BookingCard
              key={b._id}
              booking={b}
              onCancel={handleCancel}
              onReview={setReviewTarget}
            />
          ))}
        </div>
      )}

      <ReviewModal open={!!reviewTarget} onClose={handleReviewClose} booking={reviewTarget} />
    </PageLayout>
  );
}
import { useEffect, useState, useCallback } from "react";
import { Search, Phone, Star, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import { serviceAPI, reviewAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Spinner, EmptyState, StarRating, Avatar, Modal, Textarea, Button } from "../../components/ui";

function ReviewModal({ open, onClose, service }) {
  const [form, setForm] = useState({ rating: 0, comment: "" });
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !service) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await reviewAPI.getAll({ targetType: "SERVICE", serviceId: service._id });
        setReviews(res.data.data.reviews);
        setStats(res.data.data.stats);
      } catch { } finally { setLoading(false); }
    };
    fetch();
  }, [open, service]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!form.rating) return toast.error("Please select a rating.");
    setSubmitting(true);
    try {
      const res = await reviewAPI.add({ ...form, targetType: "SERVICE", serviceId: service._id });
      setReviews((prev) => [res.data.data.review, ...prev]);
      setForm({ rating: 0, comment: "" });
      toast.success("Review submitted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review.");
    } finally { setSubmitting(false); }
  };

  if (!service) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Reviews — ${service.name}`} maxWidth="max-w-xl">
      <div className="space-y-5">
        {stats.total > 0 && (
          <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl">
            <span className="text-3xl font-extrabold text-gray-900">{stats.average}</span>
            <div>
              <StarRating value={Math.round(stats.average)} readonly />
              <p className="text-xs text-gray-500 mt-0.5">{stats.total} review{stats.total !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}

        <form onSubmit={submitReview} className="card border border-gray-100 space-y-3">
          <h4 className="font-bold text-gray-900 text-sm">Add Your Review</h4>
          <StarRating value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
          <Textarea placeholder="Share your experience..." value={form.comment} rows={3}
            onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          <Button type="submit" size="sm" loading={submitting}>Submit</Button>
        </form>

        {loading ? <Spinner size="sm" /> : (
          <div className="space-y-3">
            {reviews.length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">No reviews yet. Be the first!</p>
              : reviews.map((r) => (
                <div key={r._id} className="flex gap-3">
                  <Avatar src={r.userId?.avatar?.url} name={r.userId?.name} size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{r.userId?.name}</span>
                      <StarRating value={r.rating} readonly />
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 mt-0.5">{r.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function ServiceCard({ service, onReview }) {
  return (
    <div className="card hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 overflow-hidden">
          {service.photo?.url
            ? <img src={service.photo.url} alt={service.name} className="w-full h-full object-cover" />
            : <Wrench className="w-7 h-7 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-gray-900">{service.name}</h3>
          <span className="inline-block text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full font-semibold capitalize mb-1">
            {service.serviceType}
          </span>
          {service.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{service.description}</p>
          )}
          <div className="flex items-center gap-4">
            <a href={`tel:${service.phone}`} className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              <Phone size={13} /> {service.phone}
            </a>
            {service.averageRating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={13} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold text-gray-700">{service.averageRating}</span>
                <span className="text-xs text-gray-400">({service.totalReviews})</span>
              </div>
            )}
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => onReview(service)}>
          <Star size={13} /> Review
        </Button>
      </div>
    </div>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.serviceType = typeFilter;
      const [sRes, tRes] = await Promise.all([serviceAPI.getAll(params), serviceAPI.getTypes()]);
      setServices(sRes.data.data.services);
      setTypes(tRes.data.data.types);
    } catch { } finally { setLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  return (
    <PageLayout>
      <PageHeader title="Services Directory" description="Find trusted service providers in your society" />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input className="input pl-9" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {types.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : services.length === 0 ? (
        <EmptyState icon={Wrench} title="No services found" description="Your society admin hasn't added any service providers yet." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => <ServiceCard key={s._id} service={s} onReview={setReviewTarget} />)}
        </div>
      )}

      <ReviewModal open={!!reviewTarget} onClose={() => setReviewTarget(null)} service={reviewTarget} />
    </PageLayout>
  );
}

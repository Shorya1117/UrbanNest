import { useEffect, useState, useCallback } from "react";
import { Search, Phone, Star, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import { serviceAPI, reviewAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Spinner, EmptyState, StarRating, Modal, Button, Textarea } from "../../components/ui";

function ReviewModal({ open, onClose, service }) {
  const [reviews, setReviews]   = useState([]);
  const [stats, setStats]       = useState({ average: 0, total: 0 });
  const [form, setForm]         = useState({ rating: 0, comment: "" });
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !service) return;
    setLoading(true);
    reviewAPI.getAll({ targetType: "SERVICE", serviceId: service._id })
      .then((res) => { setReviews(res.data.data.reviews); setStats(res.data.data.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
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
      toast.error(err.response?.data?.message || "Failed.");
    } finally { setSubmitting(false); }
  };

  if (!service) return null;

  return (
    <Modal open={open} onClose={onClose} title={`${service.name} — Reviews`} maxWidth="max-w-lg">
      <div className="space-y-5">
        {stats.total > 0 && (
          <div className="flex items-center gap-4 p-4 rounded-xl"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <span className="text-4xl font-bold" style={{ fontFamily: "Syne", color: "var(--text-primary)" }}>
              {stats.average}
            </span>
            <div>
              <StarRating value={Math.round(stats.average)} readonly />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {stats.total} review{stats.total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 rounded-xl space-y-3" style={{ border: "1px solid var(--border)" }}>
          <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Write a Review</h4>
          <form onSubmit={submitReview} className="space-y-3">
            <StarRating value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
            <Textarea placeholder="Share your experience…" value={form.comment} rows={2}
              onChange={(e) => setForm({ ...form, comment: e.target.value })} />
            <Button type="submit" size="sm" loading={submitting}>Submit</Button>
          </form>
        </div>

        {loading ? <Spinner size="sm" /> : (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
                No reviews yet. Be the first!
              </p>
            ) : reviews.map((r) => (
              <div key={r._id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)" }}>
                  {r.userId?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {r.userId?.name}
                    </span>
                    <StarRating value={r.rating} readonly />
                  </div>
                  {r.comment && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{r.comment}</p>}
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
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
    <div className="card hover-lift" style={{ transition: "all 0.2s" }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          {service.photo?.url
            ? <img src={service.photo.url} alt={service.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <Wrench size={22} style={{ color: "var(--text-muted)" }} />
              </div>}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{service.name}</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
            style={{ background: "var(--emerald-glow)", color: "var(--emerald)" }}>
            {service.serviceType}
          </span>
        </div>
      </div>

      {service.description && (
        <p className="text-xs mb-4 line-clamp-2" style={{ color: "var(--text-muted)" }}>
          {service.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <a href={`tel:${service.phone}`}
            className="flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: "var(--emerald)" }}>
            <Phone size={14} /> {service.phone}
          </a>
          {service.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={12} style={{ color: "#F59E0B", fill: "#F59E0B" }} />
              <span className="text-xs font-bold" style={{ color: "#D97706" }}>{service.averageRating}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>({service.totalReviews})</span>
            </div>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => onReview(service)}>
          Review
        </Button>
      </div>
    </div>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [types, setTypes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)     params.search      = search;
      if (typeFilter) params.serviceType = typeFilter;
      const [sRes, tRes] = await Promise.all([serviceAPI.getAll(params), serviceAPI.getTypes()]);
      setServices(sRes.data.data.services);
      setTypes(tRes.data.data.types);
    } catch {}
    finally { setLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  return (
    <PageLayout>
      <PageHeader title="Services Directory" description="Find trusted service providers in your society" />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1" style={{ minWidth: "200px" }}>
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }} />
          <input className="input pl-10" placeholder="Search services…" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        {types.length > 0 && (
          <select className="input" style={{ width: "160px" }} value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {types.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
        )}
      </div>

      {loading ? <Spinner /> : services.length === 0 ? (
        <EmptyState icon={Wrench} title="No services found"
          description="Your admin hasn't added any service providers yet." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => <ServiceCard key={s._id} service={s} onReview={setReviewTarget} />)}
        </div>
      )}

      <ReviewModal open={!!reviewTarget} onClose={() => setReviewTarget(null)} service={reviewTarget} />
    </PageLayout>
  );
}
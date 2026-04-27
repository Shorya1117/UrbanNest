import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Tag, CheckCircle, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { listingAPI, reviewAPI } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { PageLayout } from "../../components/layout";
import { Button, Spinner, StarRating, Textarea } from "../../components/ui";

export default function ListingDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const [listing, setListing]       = useState(null);
  const [reviews, setReviews]       = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [activeImg, setActiveImg]   = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [marking, setMarking]       = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Load listing first
        const lRes = await listingAPI.getOne(id);
        setListing(lRes.data.data.listing);
      } catch {
        navigate("/marketplace");
        return;
      }

      // Load reviews separately — don't crash page if this fails
      try {
        const rRes = await reviewAPI.getAll({ targetType: "LISTING", listingId: id });
        setReviews(rRes.data.data.reviews || []);
        setReviewStats(rRes.data.data.stats || { average: 0, total: 0 });
      } catch {
        // Reviews failing should not crash the page
        setReviews([]);
        setReviewStats({ average: 0, total: 0 });
      }

      setLoading(false);
    };
    load();
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) return toast.error("Please select a rating.");
    setSubmitting(true);
    try {
      const res = await reviewAPI.add({ ...reviewForm, targetType: "LISTING", listingId: id });
      setReviews((prev) => [res.data.data.review, ...prev]);
      setReviewForm({ rating: 0, comment: "" });
      toast.success("Review added!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add review.");
    } finally { setSubmitting(false); }
  };

  const handleMarkSold = async () => {
    setMarking(true);
    try {
      await listingAPI.markSold(listing._id);
      setListing({ ...listing, status: "SOLD" });
      toast.success("Marked as sold!");
    } catch { toast.error("Failed."); }
    finally { setMarking(false); }
  };

  if (loading) return <PageLayout><Spinner /></PageLayout>;
  if (!listing) return null;

  const isSeller = listing.sellerId?._id === user?._id;
  const seller   = listing.sellerId;

  return (
    <PageLayout>
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium mb-6"
        style={{ color: "var(--text-muted)" }}>
        <ArrowLeft size={15} /> Back to Marketplace
      </button>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* ── Images (3 cols) ───────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl overflow-hidden mb-3"
            style={{ aspectRatio: "4/3", background: "var(--surface-2)" }}>
            {listing.images?.[activeImg]?.url
              ? <img src={listing.images[activeImg].url} alt={listing.title}
                  className="w-full h-full object-contain" />
              : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <ShoppingBag size={48} style={{ color: "var(--border)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No photos</p>
                </div>
              )}
          </div>
          {listing.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {listing.images.map((img, idx) => (
                <button key={idx} onClick={() => setActiveImg(idx)}
                  className="w-16 h-16 rounded-xl overflow-hidden shrink-0 transition-all"
                  style={{
                    border: `2px solid ${idx === activeImg ? "var(--emerald)" : "var(--border)"}`,
                    opacity: idx === activeImg ? 1 : 0.65,
                  }}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info (2 cols) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title & status */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-2xl font-bold leading-tight"
                style={{ color: "var(--text-primary)" }}>
                {listing.title}
              </h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                style={{
                  background: listing.status === "AVAILABLE" ? "rgba(16,185,129,0.1)" : "var(--surface-2)",
                  color:      listing.status === "AVAILABLE" ? "#059669" : "var(--text-muted)",
                }}>
                {listing.status}
              </span>
            </div>

            <p className="text-3xl font-bold" style={{ color: "var(--emerald)" }}>
              ₹{listing.price?.toLocaleString()}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {listing.categoryId?.name && (
              <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                <Tag size={11} /> {listing.categoryId.name}
              </span>
            )}
            <span className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              {listing.condition?.replace(/_/g, " ")}
            </span>
            {listing.negotiable && (
              <span className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ background: "rgba(59,130,246,0.1)", color: "#2563EB" }}>
                Negotiable
              </span>
            )}
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--text-muted)" }}>Description</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {listing.description}
            </p>
          </div>

          {/* ── Seller card ────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl space-y-4" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}>Seller</p>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)" }}>
                {seller?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {listing.sellerContact?.name || seller?.name || "Society Member"}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {seller?.flatId
                    ? `Flat ${seller.flatId.blockNumber || ""}${seller.flatId.flatNumber || ""}`
                    : "Society Resident"}
                </p>
              </div>
            </div>

            {/* Contact section — phone from seller profile */}
            {!isSeller && listing.status === "AVAILABLE" && (
              <div className="space-y-2">
                {/* Show seller phone if available */}
                {(listing.sellerContact?.phone || seller?.phone) ? (
                  <a href={`tel:${listing.sellerContact?.phone || seller?.phone}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: "var(--emerald)", color: "#fff" }}>
                    <Phone size={15} /> Call Seller · {listing.sellerContact?.phone || seller?.phone}
                  </a>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
                    style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    <Phone size={14} /> Contact via society WhatsApp group
                  </div>
                )}
              </div>
            )}

            {/* Seller actions */}
            {isSeller && listing.status === "AVAILABLE" && (
              <Button variant="danger" className="w-full" onClick={handleMarkSold} loading={marking}>
                <CheckCircle size={15} /> Mark as Sold
              </Button>
            )}

            {listing.status === "SOLD" && (
              <div className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                <CheckCircle size={14} /> This item has been sold
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Reviews ──────────────────────────────────────────────────── */}
      <div className="mt-10">
        <div className="flex items-center gap-4 mb-5">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Reviews</h2>
          {reviewStats.total > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {reviewStats.average}
              </span>
              <StarRating value={Math.round(reviewStats.average)} readonly />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                ({reviewStats.total})
              </span>
            </div>
          )}
        </div>

        {/* Write review — only for buyers after item sold */}
        {!isSeller && listing.status === "SOLD" && (
          <div className="card mb-6">
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Write a Review</h3>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="label">Rating</label>
                <StarRating value={reviewForm.rating}
                  onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} />
              </div>
              <Textarea placeholder="Share your experience with this item…"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={3} />
              <Button type="submit" loading={submitting}>Submit Review</Button>
            </form>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
            No reviews yet.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="card" style={{ padding: "16px 20px" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)" }}>
                      {r.userId?.name?.charAt(0) || "?"}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {r.userId?.name}
                    </span>
                  </div>
                  <StarRating value={r.rating} readonly />
                </div>
                {r.comment && (
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{r.comment}</p>
                )}
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
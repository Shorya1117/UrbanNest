import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, User, Star } from "lucide-react";
import toast from "react-hot-toast";
import { listingAPI, reviewAPI } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { PageLayout } from "../../components/layout";
import { Button, Badge, Spinner, Avatar, StarRating, Textarea } from "../../components/ui";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [lRes, rRes] = await Promise.all([
          listingAPI.getOne(id),
          reviewAPI.getAll({ targetType: "LISTING", listingId: id }),
        ]);
        setListing(lRes.data.data.listing);
        setReviews(rRes.data.data.reviews);
        setReviewStats(rRes.data.data.stats);
      } catch { navigate("/marketplace"); }
      finally { setLoading(false); }
    };
    fetch();
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

  if (loading) return <PageLayout><Spinner /></PageLayout>;
  if (!listing) return null;

  const isSeller = listing.sellerId?._id === user?._id;

  return (
    <PageLayout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-semibold mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Marketplace
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-3">
            {listing.images?.[activeImg]?.url
              ? <img src={listing.images[activeImg].url} alt={listing.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">📦</div>}
          </div>
          {listing.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {listing.images.map((img, idx) => (
                <button key={idx} onClick={() => setActiveImg(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${idx === activeImg ? "border-primary" : "border-transparent"}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-2xl font-extrabold text-gray-900">{listing.title}</h1>
            <Badge label={listing.status} />
          </div>
          <p className="text-3xl font-extrabold text-primary mb-4">₹{listing.price.toLocaleString()}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
              {listing.condition?.replace("_", " ")}
            </span>
            {listing.negotiable && (
              <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">Negotiable</span>
            )}
          </div>

          <div className="card bg-gray-50 border border-gray-100 mb-5">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
          </div>

          {/* Seller */}
          <div className="card border border-gray-100 mb-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Seller</h3>
            <div className="flex items-center gap-3">
              <Avatar src={listing.sellerId?.avatar?.url} name={listing.sellerId?.name} />
              <div>
                <p className="text-sm font-bold text-gray-900">{listing.sellerId?.name}</p>
                <p className="text-xs text-gray-500">Society Member</p>
              </div>
            </div>
          </div>

          {listing.status === "AVAILABLE" && !isSeller && (
            <div className="p-4 bg-primary-50 border border-primary/20 rounded-xl text-sm text-primary font-medium">
              💬 Contact the seller through your society group or directly.
            </div>
          )}
          {isSeller && listing.status === "AVAILABLE" && (
            <Button variant="danger" onClick={async () => {
              await listingAPI.markSold(listing._id);
              setListing({ ...listing, status: "SOLD" });
              toast.success("Marked as sold!");
            }}>Mark as Sold</Button>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-10">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">Reviews</h2>
          {reviewStats.total > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-extrabold text-gray-900">{reviewStats.average}</span>
              <StarRating value={Math.round(reviewStats.average)} readonly />
              <span className="text-sm text-gray-500">({reviewStats.total})</span>
            </div>
          )}
        </div>

        {!isSeller && listing.status === "SOLD" && (
          <div className="card mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Write a Review</h3>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="label">Rating</label>
                <StarRating value={reviewForm.rating} onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} />
              </div>
              <Textarea label="Comment (optional)" placeholder="How was your experience?" value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={3} />
              <Button type="submit" loading={submitting}>Submit Review</Button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No reviews yet.</p>
          ) : reviews.map((r) => (
            <div key={r._id} className="card border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar src={r.userId?.avatar?.url} name={r.userId?.name} size="sm" />
                  <span className="text-sm font-bold text-gray-900">{r.userId?.name}</span>
                </div>
                <StarRating value={r.rating} readonly />
              </div>
              {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              <p className="text-xs text-gray-400 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

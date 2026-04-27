import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ShoppingBag, ArrowUpRight, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { listingAPI, categoryAPI } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Badge, Spinner, EmptyState, Modal } from "../../components/ui";

const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];

function ListingCard({ listing, onSold, onDelete, currentUserId }) {
  const isSeller = listing.sellerId?._id === currentUserId;
  const primary  = listing.images?.find((i) => i.isPrimary) || listing.images?.[0];

  return (
    <div className="card p-0 overflow-hidden group flex flex-col" style={{ borderRadius: "16px" }}>
      <Link to={`/marketplace/${listing._id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden" style={{ background: "var(--surface-2)" }}>
          {primary?.url
            ? <img src={primary.url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <ShoppingBag size={28} style={{ color: "var(--border)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>No photo</span>
              </div>}
          {listing.status === "SOLD" && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.5)" }}>
              <span className="badge badge-gray text-sm px-4 py-1.5">SOLD</span>
            </div>
          )}
          {listing.negotiable && listing.status === "AVAILABLE" && (
            <div className="absolute top-2.5 right-2.5">
              <span className="badge" style={{ background: "rgba(59,130,246,0.9)", color: "#fff" }}>Negotiable</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start gap-2 mb-1">
          <Link to={`/marketplace/${listing._id}`} className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-snug line-clamp-1" style={{ color: "var(--text-primary)" }}>
              {listing.title}
            </p>
          </Link>
        </div>

        <p className="text-xl font-bold mb-2" style={{ color: "var(--emerald)", fontWeight: "700" }}>
          ₹{listing.price?.toLocaleString()}
        </p>

        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {listing.categoryId?.name && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              {listing.categoryId.name}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            {listing.condition?.replace(/_/g, " ")}
          </span>
        </div>

        {/* Seller info — Fix 3 */}
        <div className="flex items-center gap-2 pt-3 mt-auto" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)", fontSize: "9px" }}>
            {listing.sellerId?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <span className="text-xs truncate flex-1" style={{ color: "var(--text-muted)" }}>
            {listing.sellerId?.name || "Society Member"}
          </span>
        </div>

        {isSeller && listing.status === "AVAILABLE" && (
          <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <button onClick={() => onSold(listing._id)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors"
              style={{ background: "var(--emerald-glow)", color: "var(--emerald)" }}>
              Mark Sold
            </button>
            <button onClick={() => onDelete(listing._id)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors"
              style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateListingModal({ open, onClose, onCreated }) {
  const EMPTY = { title: "", description: "", price: "", condition: "GOOD", negotiable: false, categoryId: "", sellerName: "", sellerPhone: "" };
  const [form, setForm]     = useState(EMPTY);
  const [files, setFiles]   = useState([]);
  const [previews, setPreviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setCatLoading(true);
    categoryAPI.getAll({ type: "MARKETPLACE" })
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false));
  }, [open]);

  const validate = () => {
    const e = {};
    if (!form.title.trim())        e.title       = "Required";
    if (!form.description.trim())  e.description = "Required";
    if (!form.price)               e.price       = "Required";
    if (!form.categoryId)          e.categoryId  = "Select a category";
    if (!form.sellerPhone)           e.sellerPhone = "Phone number is required.";
    return e;
  };

  const handleFiles = (selected) => {
    const arr = Array.from(selected).slice(0, 5);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({}); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title",       form.title);
      fd.append("description", form.description);
      fd.append("price",       form.price);
      fd.append("categoryId",  form.categoryId);
      fd.append("condition",   form.condition);
      fd.append("negotiable",  form.negotiable);
      fd.append("sellerName",   form.sellerName);
      fd.append("sellerPhone",  form.sellerPhone);
      files.forEach((f) => fd.append("images", f));
      const res = await listingAPI.create(fd);
      toast.success("Listing created!");
      onCreated(res.data.data.listing);
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally { setLoading(false); }
  };

  const handleClose = () => {
    setForm(EMPTY); setFiles([]); setPreviews([]); setErrors({}); onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create Listing" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="label">Title *</label>
          <input className={`input ${errors.title ? "input-error" : ""}`}
            placeholder="What are you selling?" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          {errors.title && <p className="text-xs" style={{ color: "#EF4444" }}>{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="label">Description *</label>
          <textarea rows={3} className={`input resize-none ${errors.description ? "input-error" : ""}`}
            placeholder="Describe condition, age, any defects..." value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {errors.description && <p className="text-xs" style={{ color: "#EF4444" }}>{errors.description}</p>}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="label">Category *</label>
          {catLoading ? (
            <div className="input text-sm" style={{ color: "var(--text-muted)" }}>Loading categories…</div>
          ) : categories.length === 0 ? (
            <div className="input text-sm" style={{ color: "#EF4444" }}>
              No categories found. Ask admin to create marketplace categories first.
            </div>
          ) : (
            <select className={`input ${errors.categoryId ? "input-error" : ""}`}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">— Select category —</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}
          {errors.categoryId && <p className="text-xs" style={{ color: "#EF4444" }}>{errors.categoryId}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="label">Price (₹) *</label>
            <input type="number" min="0" placeholder="0" className={`input ${errors.price ? "input-error" : ""}`}
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            {errors.price && <p className="text-xs" style={{ color: "#EF4444" }}>{errors.price}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="label">Condition *</label>
            <select className="input" value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={form.negotiable}
              onChange={(e) => setForm({ ...form, negotiable: e.target.checked })} />
            <div className="w-10 h-5 rounded-full transition-colors"
              style={{ background: form.negotiable ? "var(--emerald)" : "var(--border)" }}>
              <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform shadow"
                style={{ left: form.negotiable ? "22px" : "2px" }} />
            </div>
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Price is negotiable</span>
        </label>

        {/* Image upload */}
        <div className="space-y-2">
          <label className="label">Photos (up to 5)</label>
          <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-colors"
            style={{ border: "2px dashed var(--border)", background: "var(--surface-2)" }}>
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => handleFiles(e.target.files)} />
            <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Click or drag images here
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>JPG, PNG up to 5MB each</div>
          </label>
          {previews.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {previews.map((p, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden"
                  style={{ border: "2px solid var(--emerald)" }}>
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 text-center text-white"
                      style={{ fontSize: "8px", background: "var(--emerald)", padding: "1px" }}>COVER</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">Create Listing</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Marketplace() {
  const { user }  = useAuth();
  const [listings, setListings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [condition, setCondition]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    categoryAPI.getAll({ type: "MARKETPLACE" })
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => {});
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search)         params.search     = search;
      if (condition)      params.condition  = condition;
      if (categoryFilter) params.categoryId = categoryFilter;
      const res = await listingAPI.getAll(params);
      setListings(res.data.data.listings);
      setPagination(res.data.data.pagination);
    } catch {}
    finally { setLoading(false); }
  }, [page, search, condition, categoryFilter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleSold = async (id) => {
    try {
      await listingAPI.markSold(id);
      toast.success("Marked as sold!");
      setListings((prev) => prev.map((l) => l._id === id ? { ...l, status: "SOLD" } : l));
    } catch { toast.error("Failed."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await listingAPI.remove(id);
      toast.success("Deleted.");
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch { toast.error("Failed."); }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Marketplace"
        description="Buy and sell within your society"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={15} /> List Item
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1" style={{ minWidth: "200px" }}>
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }} />
          <input className="input pl-10" placeholder="Search listings…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {categories.length > 0 && (
          <select className="input" style={{ width: "160px" }} value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
        <select className="input" style={{ width: "150px" }} value={condition}
          onChange={(e) => { setCondition(e.target.value); setPage(1); }}>
          <option value="">All Conditions</option>
          {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : listings.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No listings found"
          description="Be the first to list something in your society."
          action={<Button onClick={() => setShowModal(true)}><Plus size={15} /> Create Listing</Button>} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((l) => (
              <ListingCard key={l._id} listing={l}
                onSold={handleSold} onDelete={handleDelete} currentUserId={user?._id} />
            ))}
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {page} / {pagination.pages}
              </span>
              <Button variant="secondary" size="sm" disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      <CreateListingModal open={showModal} onClose={() => setShowModal(false)}
        onCreated={(l) => setListings((prev) => [l, ...prev])} />
    </PageLayout>
  );
}
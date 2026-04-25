import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { listingAPI, categoryAPI } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Badge, Spinner, EmptyState, Modal, Input, Select, Textarea } from "../../components/ui";

const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];

// ─── Listing Card ─────────────────────────────────────────────────────────────
function ListingCard({ listing, onSold, onDelete, currentUserId }) {
  const isSeller = listing.sellerId?._id === currentUserId;
  const primary  = listing.images?.find((i) => i.isPrimary) || listing.images?.[0];

  return (
    <div className="card hover:shadow-card-hover transition-all duration-200 overflow-hidden group p-0">
      <Link to={`/marketplace/${listing._id}`}>
        <div className="aspect-video bg-gray-100 overflow-hidden">
          {primary?.url
            ? <img src={primary.url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-10 h-10 text-gray-300" /></div>}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link to={`/marketplace/${listing._id}`} className="text-sm font-bold text-gray-900 hover:text-primary line-clamp-1">
            {listing.title}
          </Link>
          <Badge label={listing.status} />
        </div>
        <p className="text-xl font-extrabold text-primary mb-1">₹{listing.price.toLocaleString()}</p>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {listing.categoryId?.name && (
            <span className="text-xs text-primary bg-primary-50 px-2 py-0.5 rounded-full font-semibold">
              {listing.categoryId.name}
            </span>
          )}
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {listing.condition?.replace(/_/g, " ")}
          </span>
          {listing.negotiable && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Negotiable</span>
          )}
        </div>
        {isSeller && listing.status === "AVAILABLE" && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Button size="sm" variant="ghost"  onClick={() => onSold(listing._id)}   className="flex-1 text-xs">Mark Sold</Button>
            <Button size="sm" variant="danger" onClick={() => onDelete(listing._id)} className="flex-1 text-xs">Delete</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Listing Modal ─────────────────────────────────────────────────────
function CreateListingModal({ open, onClose, onCreated }) {
  const EMPTY = { title: "", description: "", price: "", condition: "GOOD", negotiable: false, categoryId: "" };
  const [form, setForm]         = useState(EMPTY);
  const [files, setFiles]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  // Load marketplace categories when modal opens
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
    if (!form.title.trim())       e.title       = "Title is required.";
    if (!form.description.trim()) e.description  = "Description is required.";
    if (!form.price)              e.price        = "Price is required.";
    if (!form.categoryId)         e.categoryId   = "Please select a category.";
    if (!form.condition)          e.condition    = "Please select a condition.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title",       form.title);
      fd.append("description", form.description);
      fd.append("price",       form.price);
      fd.append("categoryId",  form.categoryId);
      fd.append("condition",   form.condition);
      fd.append("negotiable",  form.negotiable);
      files.forEach((f) => fd.append("images", f));

      const res = await listingAPI.create(fd);
      toast.success("Listing created!");
      onCreated(res.data.data.listing);
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY);
    setFiles([]);
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create Listing" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="label">Title *</label>
          <input
            className={`input ${errors.title ? "border-red-400" : ""}`}
            placeholder="e.g. Sony LED TV 43 inch"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="label">Description *</label>
          <textarea
            rows={3}
            className={`input resize-none ${errors.description ? "border-red-400" : ""}`}
            placeholder="Describe your item..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="label">Category *</label>
          {catLoading ? (
            <div className="input flex items-center gap-2 text-gray-400 text-sm">
              <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className={`input text-sm text-red-500 ${errors.categoryId ? "border-red-400" : ""}`}>
              No marketplace categories found. Ask your admin to add categories first.
            </div>
          ) : (
            <select
              className={`input ${errors.categoryId ? "border-red-400" : ""}`}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">— Select a category —</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          )}
          {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId}</p>}
        </div>

        {/* Price + Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="label">Price (₹) *</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className={`input ${errors.price ? "border-red-400" : ""}`}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="label">Condition *</label>
            <select
              className={`input ${errors.condition ? "border-red-400" : ""}`}
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
            {errors.condition && <p className="text-xs text-red-500">{errors.condition}</p>}
          </div>
        </div>

        {/* Negotiable */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-primary"
            checked={form.negotiable}
            onChange={(e) => setForm({ ...form, negotiable: e.target.checked })}
          />
          <span className="text-sm font-semibold text-gray-700">Price is negotiable</span>
        </label>

        {/* Images */}
        <div className="space-y-1.5">
          <label className="label">Images (up to 5, optional)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100"
          />
          {files.length > 0 && (
            <p className="text-xs text-gray-500">{files.length} file(s) selected</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">Create Listing</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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

  // Load categories for filter bar
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
    } catch { }
    finally { setLoading(false); }
  }, [page, search, condition, categoryFilter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleSold = async (id) => {
    try {
      await listingAPI.markSold(id);
      toast.success("Marked as sold!");
      setListings((prev) => prev.map((l) => l._id === id ? { ...l, status: "SOLD" } : l));
    } catch { toast.error("Failed to mark as sold."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await listingAPI.remove(id);
      toast.success("Listing deleted.");
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch { toast.error("Failed to delete."); }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Marketplace"
        description="Buy and sell within your society"
        action={<Button onClick={() => setShowModal(true)}><Plus size={16} /> List Item</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {categories.length > 0 && (
          <select
            className="input w-44"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        )}

        <select
          className="input w-40"
          value={condition}
          onChange={(e) => { setCondition(e.target.value); setPage(1); }}
        >
          <option value="">All Conditions</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Listings grid */}
      {loading ? (
        <Spinner />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No listings found"
          description="Be the first to list something for sale in your society!"
          action={<Button onClick={() => setShowModal(true)}><Plus size={16} /> Create Listing</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((l) => (
              <ListingCard
                key={l._id}
                listing={l}
                onSold={handleSold}
                onDelete={handleDelete}
                currentUserId={user?._id}
              />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-600 font-semibold">
                Page {page} of {pagination.pages}
              </span>
              <Button variant="secondary" size="sm" disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <CreateListingModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(l) => { setListings((prev) => [l, ...prev]); }}
      />
    </PageLayout>
  );
}
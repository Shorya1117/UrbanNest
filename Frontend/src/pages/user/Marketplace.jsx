import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, SlidersHorizontal, ShoppingBag, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { listingAPI } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Badge, Spinner, EmptyState, Modal, Input, Select, Textarea } from "../../components/ui";

const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];

function ListingCard({ listing, onSold, onDelete, currentUserId }) {
  const isSeller = listing.sellerId?._id === currentUserId;
  const primary = listing.images?.find((i) => i.isPrimary) || listing.images?.[0];

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
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{listing.condition?.replace("_", " ")}</span>
          {listing.negotiable && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Negotiable</span>}
        </div>
        {isSeller && listing.status === "AVAILABLE" && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Button size="sm" variant="ghost" onClick={() => onSold(listing._id)} className="flex-1 text-xs">Mark Sold</Button>
            <Button size="sm" variant="danger" onClick={() => onDelete(listing._id)} className="flex-1 text-xs">Delete</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateListingModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", description: "", price: "", condition: "GOOD", negotiable: false, categoryId: "" });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.description) return toast.error("Please fill all required fields.");
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append("images", f));
      const res = await listingAPI.create(fd);
      toast.success("Listing created!");
      onCreated(res.data.data.listing);
      onClose();
      setForm({ title: "", description: "", price: "", condition: "GOOD", negotiable: false, categoryId: "" });
      setFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create listing.");
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Listing" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title *" placeholder="e.g. Sony LED TV 43 inch" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea label="Description *" placeholder="Describe your item..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Price (₹) *" type="number" min="0" placeholder="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Select label="Condition *" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
          </Select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.negotiable} onChange={(e) => setForm({ ...form, negotiable: e.target.checked })} />
          <span className="text-sm font-semibold text-gray-700">Price is negotiable</span>
        </label>
        <div className="space-y-1.5">
          <label className="label">Images (up to 5)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100" />
          {files.length > 0 && <p className="text-xs text-gray-500">{files.length} file(s) selected</p>}
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">Create Listing</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (condition) params.condition = condition;
      const res = await listingAPI.getAll(params);
      setListings(res.data.data.listings);
      setPagination(res.data.data.pagination);
    } catch { /* handled globally */ }
    finally { setLoading(false); }
  }, [page, search, condition]);

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
          <input className="input pl-9" placeholder="Search listings..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-40" value={condition} onChange={(e) => { setCondition(e.target.value); setPage(1); }}>
          <option value="">All Conditions</option>
          {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : listings.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No listings found"
          description="Be the first to list something for sale in your society!"
          action={<Button onClick={() => setShowModal(true)}><Plus size={16} /> Create Listing</Button>} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((l) => (
              <ListingCard key={l._id} listing={l} onSold={handleSold} onDelete={handleDelete} currentUserId={user?._id} />
            ))}
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-gray-600 font-semibold">Page {page} of {pagination.pages}</span>
              <Button variant="secondary" size="sm" disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      <CreateListingModal open={showModal} onClose={() => setShowModal(false)} onCreated={(l) => setListings((prev) => [l, ...prev])} />
    </PageLayout>
  );
}

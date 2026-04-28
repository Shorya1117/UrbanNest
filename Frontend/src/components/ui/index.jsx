import { useRef, useEffect } from "react";

// ─── Button ───────────────────────────────────────────────────────────────────
export const Button = ({
  children, variant = "primary", size = "md", loading = false,
  className = "", as: Tag = "button", ...props
}) => {
  const varMap = {
    primary: "btn-primary", secondary: "btn-secondary",
    ghost: "btn-ghost", danger: "btn-danger",
  };
  const sizeMap = {
    xs: "text-xs px-3 py-1.5 gap-1", sm: "text-sm px-3.5 py-2",
    md: "px-5 py-2.5", lg: "px-6 py-3 text-base",
  };
  return (
    <Tag
      className={`btn ${varMap[variant] || "btn-primary"} ${sizeMap[size] || ""} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </Tag>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = ({ label, error, hint, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="label">{label}</label>}
    <input className={`input ${error ? "input-error" : ""} ${className}`} {...props} />
    {error && <p className="text-xs font-medium" style={{ color: "#EF4444" }}>{error}</p>}
    {hint && !error && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>}
  </div>
);

// ─── Select ───────────────────────────────────────────────────────────────────
export const Select = ({ label, error, children, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="label">{label}</label>}
    <select className={`input ${error ? "input-error" : ""} ${className}`} {...props}>
      {children}
    </select>
    {error && <p className="text-xs font-medium" style={{ color: "#EF4444" }}>{error}</p>}
  </div>
);

// ─── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = ({ label, error, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="label">{label}</label>}
    <textarea rows={4} className={`input resize-none ${error ? "input-error" : ""} ${className}`} {...props} />
    {error && <p className="text-xs font-medium" style={{ color: "#EF4444" }}>{error}</p>}
  </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
const BADGE_MAP = {
  PENDING: "badge-yellow", IN_PROGRESS: "badge-blue", RESOLVED: "badge-green",
  AVAILABLE: "badge-green", SOLD: "badge-gray",
  ADMIN: "badge-purple", HEAD: "badge-blue", MEMBER: "badge-gray",
  ACTIVE: "badge-green", INACTIVE: "badge-gray",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};
export const Badge = ({ label, className = "" }) => (
  <span className={`badge ${BADGE_MAP[label] || "badge-gray"} ${className}`}>
    {label?.replace(/_/g, " ")}
  </span>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = "md" }) => {
  const s = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className="flex items-center justify-center p-10">
      <div className={`${s[size]} rounded-full border-2 border-transparent animate-spin`}
        style={{ borderTopColor: "var(--emerald)", borderRightColor: "var(--emerald-glow)" }} />
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = "max-w-lg" }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose} />
      <div className={`relative w-full ${maxWidth} animate-scale-in rounded-t-2xl sm:rounded-2xl overflow-hidden`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-display font-700 text-lg" style={{ color: "var(--text-primary)", fontFamily: "Syne" }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg btn-ghost"
            style={{ color: "var(--text-muted)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "var(--emerald-glow)" }}>
        <Icon size={28} style={{ color: "var(--emerald)" }} />
      </div>
    )}
    <h3 className="font-display font-bold text-lg mb-2" style={{ fontFamily: "Syne", color: "var(--text-primary)" }}>{title}</h3>
    {description && <p className="text-sm mb-5 max-w-xs" style={{ color: "var(--text-muted)" }}>{description}</p>}
    {action}
  </div>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const Avatar = ({ src, name, size = "md" }) => {
  const sizes = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };
  const initials = name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";
  return src
    ? <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
    : (
      <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
        style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)" }}>
        {initials}
      </div>
    );
};

// ─── Star Rating ──────────────────────────────────────────────────────────────
export const StarRating = ({ value = 0, onChange, readonly = false }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} type="button"
        onClick={() => !readonly && onChange?.(star)}
        className={`text-xl transition-transform ${!readonly ? "hover:scale-125 cursor-pointer" : "cursor-default"}`}
        style={{ color: star <= value ? "#F59E0B" : "var(--border)" }}>
        ★
      </button>
    ))}
  </div>
);

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, description, loading }) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
    <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{description}</p>
    <div className="flex gap-3">
      <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
      <Button variant="danger" onClick={onConfirm} loading={loading} className="flex-1">Delete</Button>
    </div>
  </Modal>
);

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
export const ThemeToggle = () => {
  const { isDark, toggle } = (() => {
    try {
      
      return useTheme();
    } catch { return { isDark: false, toggle: () => {} }; }
  })();

  return (
    <button onClick={toggle}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all btn-ghost"
      title={isDark ? "Switch to light" : "Switch to dark"}>
      {isDark
        ? <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        : <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>}
    </button>
  );
};
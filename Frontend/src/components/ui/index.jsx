// ─── Button ───────────────────────────────────────────────────────────────────
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  ...props
}) => {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-600 shadow-sm",
    secondary: "bg-white text-primary border border-primary hover:bg-primary-50",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "text-gray-600 hover:bg-gray-100",
    gradient: "bg-brand-gradient text-white shadow-sm hover:opacity-90",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3 text-base" };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = ({ label, error, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="label">{label}</label>}
    <input
      className={`input ${error ? "border-red-400 focus:ring-red-200 focus:border-red-400" : ""} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// ─── Select ───────────────────────────────────────────────────────────────────
export const Select = ({ label, error, children, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="label">{label}</label>}
    <select
      className={`input ${error ? "border-red-400" : ""} ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// ─── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = ({ label, error, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="label">{label}</label>}
    <textarea
      rows={4}
      className={`input resize-none ${error ? "border-red-400" : ""} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
const badgeMap = {
  PENDING: "badge-pending",
  IN_PROGRESS: "badge-progress",
  RESOLVED: "badge-resolved",
  AVAILABLE: "badge-available",
  SOLD: "badge-sold",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  ADMIN: "bg-purple-100 text-purple-800",
  HEAD: "bg-blue-100 text-blue-800",
  MEMBER: "bg-gray-100 text-gray-700",
};
export const Badge = ({ label }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeMap[label] || "bg-gray-100 text-gray-700"}`}>
    {label?.replace("_", " ")}
  </span>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = "md" }) => {
  const s = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className="flex items-center justify-center p-8">
      <svg className={`animate-spin ${s[size]} text-primary`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = "max-w-lg" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
    )}
    <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>}
    {action}
  </div>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const Avatar = ({ src, name, size = "md" }) => {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };
  const initials = name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";
  return src ? (
    <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
  ) : (
    <div className={`${sizes[size]} rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold`}>
      {initials}
    </div>
  );
};

// ─── Star Rating ──────────────────────────────────────────────────────────────
export const StarRating = ({ value = 0, onChange, readonly = false }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => !readonly && onChange?.(star)}
        className={`text-xl transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} ${star <= value ? "text-yellow-400" : "text-gray-300"}`}
      >
        ★
      </button>
    ))}
  </div>
);

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, description, loading }) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
    <p className="text-sm text-gray-600 mb-6">{description}</p>
    <div className="flex gap-3 justify-end">
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
    </div>
  </Modal>
);

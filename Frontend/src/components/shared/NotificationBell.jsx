import { useEffect, useState, useRef } from "react";
import { Bell, CheckCheck, X, MessageSquare, ShoppingBag, Megaphone, Wrench, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { notificationAPI } from "../../api/services";

const TYPE_CONFIG = {
  COMPLAINT_UPDATE: { icon: MessageSquare, color: "#3B82F6" },
  MARKETPLACE:      { icon: ShoppingBag,   color: "#10B981" },
  SERVICE:          { icon: Wrench,        color: "#8B5CF6" },
  ANNOUNCEMENT:     { icon: Megaphone,     color: "#EF4444" },
  GENERAL:          { icon: Info,          color: "#64748B" },
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationAPI.getAll({ limit: 1 });
        setUnread(res.data.data.unreadCount);
      } catch {}
    };
    fetchCount();
    const iv = setInterval(fetchCount, 60000);
    return () => clearInterval(iv);
  }, []);

  const handleOpen = () => {
    if (!open) {
      setLoading(true);
      notificationAPI.getAll({ limit: 8 })
        .then((res) => {
          setNotifications(res.data.data.notifications);
          setUnread(res.data.data.unreadCount);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    setOpen((p) => !p);
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnread((u) => Math.max(0, u - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl btn-ghost">
        <Bell size={18} style={{ color: "var(--text-secondary)" }} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] flex items-center justify-center rounded-full text-white font-bold"
            style={{ background: "#EF4444", fontSize: "10px", padding: "0 4px" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50 animate-scale-in"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-sm font-bold" style={{ fontFamily: "Syne", color: "var(--text-primary)" }}>
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: "var(--emerald)" }}>
                  <CheckCheck size={12} /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="btn-ghost w-6 h-6 flex items-center justify-center rounded-lg">
                <X size={14} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{ borderColor: "var(--border)", borderTopColor: "var(--emerald)" }} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Bell size={24} style={{ color: "var(--border)" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No notifications</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.GENERAL;
                  const Icon = cfg.icon;
                  return (
                    <div key={n._id} onClick={() => !n.isRead && markRead(n._id)}
                      className="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
                      style={{ background: !n.isRead ? cfg.color + "10" : "transparent" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = !n.isRead ? cfg.color + "10" : "transparent"}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: cfg.color + "20" }}>
                        <Icon size={13} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                          {n.message}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ background: cfg.color }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
            <Link to="/notifications" onClick={() => setOpen(false)}
              className="text-xs font-semibold" style={{ color: "var(--emerald)" }}>
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
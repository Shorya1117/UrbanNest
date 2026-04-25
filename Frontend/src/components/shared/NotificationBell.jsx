import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { notificationAPI } from "../../api/services";

const TYPE_COLORS = {
  COMPLAINT_UPDATE: "bg-blue-100 text-blue-700",
  MARKETPLACE:      "bg-green-100 text-green-700",
  ANNOUNCEMENT:     "bg-red-100 text-red-700",
  APPROVAL:         "bg-yellow-100 text-yellow-700",
  GENERAL:          "bg-gray-100 text-gray-600",
  SERVICE:          "bg-purple-100 text-purple-700",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const intervalRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch unread count silently — no extra state flicker
  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationAPI.getAll({ limit: 1 });
      setUnread(res.data.data.unreadCount ?? 0);
    } catch {}
  }, []);

  // Poll unread count every 30s (was 60s — now faster for near-realtime feel)
  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchCount]);

  const fetchNotifications = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ limit: 10 });
      setNotifications(res.data.data.notifications);
      setUnread(res.data.data.unreadCount ?? 0);
    } catch {}
    finally { setLoading(false); }
  }, [loading]);

  const handleOpen = () => {
    setOpen((prev) => {
      if (!prev) fetchNotifications();
      return !prev;
    });
  };

  const markRead = async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnread((u) => Math.max(0, u - 1));
    try {
      await notificationAPI.markRead(id);
    } catch {
      // Revert on failure
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await notificationAPI.markAllRead();
    } catch {
      fetchNotifications();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-extrabold text-gray-900 text-sm">
              Notifications
              {unread > 0 && (
                <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black">
                  {unread}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all read"
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={13} /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markRead(n._id)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    !n.isRead ? "bg-primary-50 hover:bg-primary-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      !n.isRead ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        TYPE_COLORS[n.type] || TYPE_COLORS.GENERAL
                      }`}
                    >
                      {n.type?.replace(/_/g, " ")}
                    </span>
                    {n.title && (
                      <p className="text-xs font-semibold text-gray-800 mt-0.5">{n.title}</p>
                    )}
                    <p className="text-xs text-gray-700 mt-0.5 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(n.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-primary font-bold hover:underline"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

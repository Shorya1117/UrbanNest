import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { notificationAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Spinner, EmptyState } from "../../components/ui";

const TYPE_COLORS = {
  COMPLAINT_UPDATE: "bg-blue-100 text-blue-800",
  MARKETPLACE: "bg-green-100 text-green-800",
  SERVICE: "bg-purple-100 text-purple-800",
  APPROVAL: "bg-yellow-100 text-yellow-800",
  ANNOUNCEMENT: "bg-red-100 text-red-800",
  GENERAL: "bg-gray-100 text-gray-700",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ limit: 50 });
      setNotifications(res.data.data.notifications);
      setUnread(res.data.data.unreadCount ?? 0);
    } catch {
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh every 30s to catch new notifications without manual reload
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    // Optimistic
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await notificationAPI.markRead(id);
    } catch {
      toast.error("Failed to mark as read.");
      fetchNotifications(); // revert
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await notificationAPI.markAllRead();
      toast.success("All marked as read.");
    } catch {
      toast.error("Failed.");
      fetchNotifications();
    }
  };

  const remove = async (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await notificationAPI.remove(id);
    } catch {
      toast.error("Failed to delete.");
      fetchNotifications();
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title={
          <span>
            Notifications{" "}
            {unread > 0 && (
              <span className="ml-2 text-sm bg-primary text-white px-2.5 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </span>
        }
        action={
          unread > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              <CheckCheck size={15} /> Mark all read
            </Button>
          )
        }
      />

      {loading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! New alerts will appear here automatically."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                !n.isRead
                  ? "bg-primary-50 border-primary/20"
                  : "bg-white border-gray-100 hover:border-gray-200"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                  !n.isRead ? "bg-primary" : "bg-gray-300"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      TYPE_COLORS[n.type] || TYPE_COLORS.GENERAL
                    }`}
                  >
                    {n.type?.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                {n.title && (
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">{n.title}</p>
                )}
                <p className="text-sm text-gray-800">{n.message}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n._id)}
                    title="Mark as read"
                    className="p-1.5 text-primary hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    <CheckCheck size={15} />
                  </button>
                )}
                <button
                  onClick={() => remove(n._id)}
                  title="Delete"
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}

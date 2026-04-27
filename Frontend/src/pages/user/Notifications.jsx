import { useEffect, useState } from "react";
import { Bell, CheckCheck, Trash2, Megaphone, MessageSquare, ShoppingBag, Wrench, Info } from "lucide-react";
import toast from "react-hot-toast";
import { notificationAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Spinner, EmptyState } from "../../components/ui";

const TYPE_CONFIG = {
  COMPLAINT_UPDATE: { icon: MessageSquare, color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  label: "Complaint" },
  MARKETPLACE:      { icon: ShoppingBag,   color: "#10B981", bg: "rgba(16,185,129,0.1)", label: "Marketplace" },
  SERVICE:          { icon: Wrench,        color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",  label: "Service" },
  ANNOUNCEMENT:     { icon: Megaphone,     color: "#EF4444", bg: "rgba(239,68,68,0.1)",   label: "Announcement" },
  APPROVAL:         { icon: CheckCheck,    color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: "Approval" },
  GENERAL:          { icon: Info,          color: "#64748B", bg: "rgba(100,116,139,0.1)", label: "General" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.data.notifications);
      setUnread(res.data.data.unreadCount);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

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
      toast.success("All marked as read.");
    } catch {}
  };

  const remove = async (id) => {
    try {
      await notificationAPI.remove(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  };

  return (
    <PageLayout>
      <PageHeader
        title={<span>Notifications {unread > 0 && (
          <span className="ml-2 text-sm font-bold px-2 py-0.5 rounded-full align-middle"
            style={{ background: "var(--emerald)", color: "#fff" }}>{unread}</span>
        )}</span>}
        action={unread > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      />

      {loading ? <Spinner /> : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up! New alerts will appear here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.GENERAL;
            const Icon = cfg.icon;
            return (
              <div key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className="flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all animate-fade-in"
                style={{
                  background: !n.isRead ? cfg.bg : "var(--surface)",
                  border: `1px solid ${!n.isRead ? "transparent" : "var(--border)"}`,
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: cfg.bg }}>
                  <Icon size={16} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: cfg.color }} />
                    )}
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>{n.message}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove(n._id); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 btn-ghost transition-opacity opacity-0 hover:opacity-100"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}>
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
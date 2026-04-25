import { useEffect, useState, useCallback } from "react";
import { Bell, Megaphone, Trash2, CheckCheck, History, Send, User } from "lucide-react";
import toast from "react-hot-toast";
import { notificationAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Spinner, EmptyState, Modal, Textarea } from "../../components/ui";

const TYPE_COLORS = {
  COMPLAINT_UPDATE: "bg-blue-100 text-blue-800",
  MARKETPLACE: "bg-green-100 text-green-800",
  ANNOUNCEMENT: "bg-red-100 text-red-800",
  APPROVAL: "bg-yellow-100 text-yellow-800",
  GENERAL: "bg-gray-100 text-gray-700",
  SERVICE: "bg-purple-100 text-purple-800",
};

function NotificationItem({ n, onRemove }) {
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-2xl border ${
        !n.isRead ? "bg-primary-50 border-primary/20" : "bg-white border-gray-100"
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
        {n.title && <p className="text-xs font-semibold text-gray-700 mb-0.5">{n.title}</p>}
        <p className="text-sm text-gray-800">{n.message}</p>
      </div>
      <button
        onClick={() => onRemove(n._id)}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function HistoryItem({ n }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border bg-white border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
        <Megaphone size={16} className="text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-bold text-gray-700">{n.title || "Announcement"}</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              TYPE_COLORS[n.type] || TYPE_COLORS.GENERAL
            }`}
          >
            {n.type?.replace(/_/g, " ")}
          </span>
        </div>
        <p className="text-sm text-gray-800 mb-1">{n.message}</p>
        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
          {n.sentBy && (
            <span className="flex items-center gap-1">
              <User size={11} />
              {n.sentBy.name} ({n.sentBy.role})
            </span>
          )}
          <span>→ {n.recipientLabel || "All Residents"}</span>
          <span>
            {new Date(n.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
              n.deliveryStatus === "DELIVERED"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {n.deliveryStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminNotifications() {
  const [tab, setTab] = useState("inbox"); // "inbox" | "history"
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "ANNOUNCEMENT" });
  const [broadcasting, setBroadcasting] = useState(false);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.data.notifications);
      setUnread(res.data.data.unreadCount);
    } catch {
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await notificationAPI.getHistory();
      setHistory(res.data.data.history);
    } catch {
      toast.error("Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  useEffect(() => {
    if (tab === "history" && !history.length) fetchHistory();
  }, [tab, history.length, fetchHistory]);

  // Auto-refresh inbox every 30s
  useEffect(() => {
    const interval = setInterval(fetchInbox, 30000);
    return () => clearInterval(interval);
  }, [fetchInbox]);

  const broadcast = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return toast.error("Message is required.");
    setBroadcasting(true);
    try {
      const res = await notificationAPI.broadcast(form);
      const { sentCount } = res.data.data;
      toast.success(`✅ Announcement sent to ${sentCount} residents!`);
      setShowBroadcast(false);
      setForm({ title: "", message: "", type: "ANNOUNCEMENT" });
      // Refresh history to show the new entry
      setHistory([]);
      fetchHistory();
    } catch {
      toast.error("Failed to send announcement.");
    } finally {
      setBroadcasting(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
      toast.success("All marked as read.");
    } catch {
      toast.error("Failed.");
    }
  };

  const remove = async (id) => {
    try {
      await notificationAPI.remove(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification removed.");
    } catch {
      toast.error("Failed.");
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Notifications"
        action={
          <div className="flex gap-2">
            {tab === "inbox" && unread > 0 && (
              <Button variant="secondary" size="sm" onClick={markAllRead}>
                <CheckCheck size={14} /> Mark all read
              </Button>
            )}
            <Button onClick={() => setShowBroadcast(true)}>
              <Megaphone size={15} /> Broadcast
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "inbox", label: "Inbox", icon: Bell },
          { key: "history", label: "Broadcast History", icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              tab === key
                ? "bg-primary text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary"
            }`}
          >
            <Icon size={13} />
            {label}
            {key === "inbox" && unread > 0 && (
              <span className="ml-1 bg-white text-primary rounded-full px-1.5 text-xs font-black">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Inbox */}
      {tab === "inbox" && (
        <>
          {loading ? (
            <Spinner />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="Your notification inbox is empty."
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <NotificationItem key={n._id} n={n} onRemove={remove} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Broadcast History */}
      {tab === "history" && (
        <>
          {historyLoading ? (
            <Spinner />
          ) : history.length === 0 ? (
            <EmptyState
              icon={History}
              title="No broadcast history"
              description="Announcements you send will appear here with full details."
            />
          ) : (
            <div className="space-y-3">
              {history.map((n) => (
                <HistoryItem key={n._id} n={n} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Broadcast Modal */}
      <Modal
        open={showBroadcast}
        onClose={() => setShowBroadcast(false)}
        title="Broadcast Announcement"
        maxWidth="max-w-md"
      >
        <form onSubmit={broadcast} className="space-y-4">
          <p className="text-sm text-gray-500">
            This message will be sent to all approved residents in your society. It will be
            permanently saved in history.
          </p>
          <div className="space-y-1.5">
            <label className="label">Title (optional)</label>
            <input
              className="input"
              placeholder="e.g. Maintenance Notice"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="label">Type</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="GENERAL">General</option>
              <option value="SERVICE">Service</option>
              <option value="MARKETPLACE">Marketplace</option>
            </select>
          </div>
          <Textarea
            label="Message *"
            placeholder="e.g. Society maintenance on Sunday 10AM–2PM. Water supply will be affected."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={4}
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setShowBroadcast(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={broadcasting} className="flex-1">
              <Send size={14} /> Send to All
            </Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}

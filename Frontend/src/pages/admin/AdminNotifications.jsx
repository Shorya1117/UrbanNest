import { useEffect, useState } from "react";
import { Bell, Megaphone, Trash2, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import { notificationAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Spinner, EmptyState, Modal, Textarea } from "../../components/ui";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [message, setMessage] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.data.notifications);
      setUnread(res.data.data.unreadCount);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const broadcast = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error("Message is required.");
    setBroadcasting(true);
    try {
      await notificationAPI.broadcast({ message, type: "ANNOUNCEMENT" });
      toast.success("Announcement sent to all residents!");
      setShowBroadcast(false);
      setMessage("");
    } catch { toast.error("Failed to send."); }
    finally { setBroadcasting(false); }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { }
  };

  const remove = async (id) => {
    try {
      await notificationAPI.remove(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch { toast.error("Failed."); }
  };

  const TYPE_COLORS = {
    COMPLAINT_UPDATE: "bg-blue-100 text-blue-800",
    MARKETPLACE: "bg-green-100 text-green-800",
    ANNOUNCEMENT: "bg-red-100 text-red-800",
    GENERAL: "bg-gray-100 text-gray-700",
  };

  return (
    <PageLayout>
      <PageHeader
        title="Notifications"
        action={
          <div className="flex gap-2">
            {unread > 0 && <Button variant="secondary" size="sm" onClick={markAllRead}><CheckCheck size={14} /> Mark all read</Button>}
            <Button onClick={() => setShowBroadcast(true)}><Megaphone size={15} /> Broadcast</Button>
          </div>
        }
      />

      {loading ? <Spinner /> : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Send an announcement to your residents." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n._id} className={`flex items-start gap-4 p-4 rounded-2xl border ${!n.isRead ? "bg-primary-50 border-primary/20" : "bg-white border-gray-100"}`}>
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.isRead ? "bg-primary" : "bg-gray-300"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[n.type] || TYPE_COLORS.GENERAL}`}>
                    {n.type?.replace("_", " ")}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                <p className="text-sm text-gray-800">{n.message}</p>
              </div>
              <button onClick={() => remove(n._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showBroadcast} onClose={() => setShowBroadcast(false)} title="Broadcast Announcement" maxWidth="max-w-md">
        <form onSubmit={broadcast} className="space-y-4">
          <p className="text-sm text-gray-500">This message will be sent as a notification to all approved residents in your society.</p>
          <Textarea label="Message *" placeholder="e.g. Society maintenance on Sunday 10AM–2PM. Water supply will be affected."
            value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          <div className="flex gap-3">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowBroadcast(false)}>Cancel</Button>
            <Button type="submit" loading={broadcasting} className="flex-1"><Megaphone size={14} /> Send to All</Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}

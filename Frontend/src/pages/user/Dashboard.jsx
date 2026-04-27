import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Wrench, MessageSquare, Bell, ArrowUpRight, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PageLayout, PageHeader } from "../../components/layout";
import { Spinner, Badge, Avatar } from "../../components/ui";
import { listingAPI, complaintAPI, notificationAPI } from "../../api/services";

const StatCard = ({ icon: Icon, label, value, color, to, sub }) => (
  <Link to={to} className="stat-card block group">
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: color + "20" }}>
        <Icon size={18} style={{ color }} />
      </div>
      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--text-muted)" }} />
    </div>
    <p className="text-3xl font-bold mb-1" style={{ fontFamily: "Syne", color: "var(--text-primary)" }}>{value}</p>
    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
    {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
  </Link>
);

export default function UserDashboard() {
  const { user } = useAuth();
  const [data, setData]   = useState({ listings: [], complaints: [], notifications: [], unread: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [l, c, n] = await Promise.all([
          listingAPI.getAll({ limit: 4 }),
          complaintAPI.getAll({ limit: 5 }),
          notificationAPI.getAll({ limit: 6 }),
        ]);
        setData({
          listings:      l.data.data.listings,
          complaints:    c.data.data.complaints,
          notifications: n.data.data.notifications,
          unread:        n.data.data.unreadCount,
        });
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <PageLayout><Spinner /></PageLayout>;

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <PageLayout>
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl mb-8 p-8"
        style={{ background: "linear-gradient(135deg, #0A1628 0%, #0F2D4A 60%, #0A1628 100%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, #10B981, transparent)" }} />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{greeting} 👋</p>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Syne" }}>{user?.name}</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Welcome to your society dashboard
            </p>
          </div>
          <div className="hidden sm:block">
            <Avatar src={user?.avatar?.url} name={user?.name} size="lg" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ShoppingBag} label="Active Listings" value={data.listings.length} color="#10B981" to="/marketplace" />
        <StatCard icon={MessageSquare} label="My Complaints" value={data.complaints.length} color="#3B82F6" to="/complaints" />
        <StatCard icon={Bell} label="Unread Alerts" value={data.unread} color="#F59E0B" to="/notifications" />
        <StatCard icon={Wrench} label="Services" value="View" color="#8B5CF6" to="/services" />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Recent Listings - wider */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold" style={{ fontFamily: "Syne", color: "var(--text-primary)", fontSize: "16px" }}>Recent Listings</h2>
            <Link to="/marketplace" className="text-xs font-semibold flex items-center gap-1"
              style={{ color: "var(--emerald)" }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {data.listings.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>No listings yet.</p>
          ) : (
            <div className="space-y-2">
              {data.listings.map((l) => (
                <Link key={l._id} to={`/marketplace/${l._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                    style={{ background: "var(--surface-2)" }}>
                    {l.images?.[0]?.url
                      ? <img src={l.images[0].url} alt={l.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={18} style={{ color: "var(--text-muted)" }} />
                        </div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{l.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      ₹{l.price?.toLocaleString()} · {l.condition?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Badge label={l.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications - narrower */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold" style={{ fontFamily: "Syne", color: "var(--text-primary)", fontSize: "16px" }}>Notifications</h2>
            {data.unread > 0 && (
              <span className="badge badge-green">{data.unread} new</span>
            )}
          </div>
          {data.notifications.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>All caught up!</p>
          ) : (
            <div className="space-y-2">
              {data.notifications.map((n) => (
                <div key={n._id}
                  className="flex gap-3 p-3 rounded-xl"
                  style={{ background: !n.isRead ? "var(--emerald-glow)" : "transparent" }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: !n.isRead ? "var(--emerald)" : "var(--border)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Clock size={10} />
                      {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/notifications" className="block mt-4 text-center text-xs font-semibold py-2 rounded-xl transition-colors"
            style={{ color: "var(--emerald)", background: "var(--emerald-glow)" }}>
            View all notifications →
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
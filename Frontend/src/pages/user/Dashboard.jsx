import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Wrench, MessageSquare, Bell, ArrowRight, TrendingUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PageLayout, PageHeader } from "../../components/layout";
import { Spinner, Badge, Avatar } from "../../components/ui";
import { listingAPI, complaintAPI, notificationAPI } from "../../api/services";

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link to={to} className="card hover:shadow-card-hover transition-all duration-200 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-semibold">{label}</p>
        <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="flex items-center gap-1 mt-4 text-xs text-primary font-semibold group-hover:gap-2 transition-all">
      View all <ArrowRight size={12} />
    </div>
  </Link>
);

export default function UserDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ listings: [], complaints: [], notifications: [], unread: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [l, c, n] = await Promise.all([
          listingAPI.getAll({ limit: 4 }),
          complaintAPI.getAll({ limit: 5 }),
          notificationAPI.getAll({ limit: 5 }),
        ]);
        setData({
          listings: l.data.data.listings,
          complaints: c.data.data.complaints,
          notifications: n.data.data.notifications,
          unread: n.data.data.unreadCount,
        });
      } catch { /* handled globally */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <PageLayout><Spinner /></PageLayout>;

  return (
    <PageLayout>
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-8 mb-8 text-white">
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-semibold mb-1">Good day,</p>
          <h1 className="text-3xl font-extrabold">{user?.name} 👋</h1>
          <p className="text-white/80 mt-1 text-sm">Welcome to your society dashboard.</p>
        </div>
        <TrendingUp className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white/10" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ShoppingBag} label="Listings" value={data.listings.length} color="bg-primary" to="/marketplace" />
        <StatCard icon={MessageSquare} label="My Complaints" value={data.complaints.length} color="bg-secondary" to="/complaints" />
        <StatCard icon={Bell} label="Unread Alerts" value={data.unread} color="bg-amber-500" to="/notifications" />
        <StatCard icon={Wrench} label="Services" value="—" color="bg-purple-500" to="/services" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-gray-900">Recent Listings</h2>
            <Link to="/marketplace" className="text-xs text-primary font-semibold hover:underline">View all</Link>
          </div>
          {data.listings.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No listings yet.</p>
          ) : (
            <div className="space-y-3">
              {data.listings.map((l) => (
                <Link key={l._id} to={`/marketplace/${l._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {l.images?.[0]?.url
                      ? <img src={l.images[0].url} alt={l.title} className="w-full h-full object-cover" />
                      : <ShoppingBag className="w-6 h-6 text-gray-400 m-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-500">₹{l.price.toLocaleString()}</p>
                  </div>
                  <Badge label={l.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-gray-900">Notifications</h2>
            <Link to="/notifications" className="text-xs text-primary font-semibold hover:underline">View all</Link>
          </div>
          {data.notifications.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No notifications.</p>
          ) : (
            <div className="space-y-2">
              {data.notifications.map((n) => (
                <div key={n._id} className={`flex gap-3 p-3 rounded-xl ${!n.isRead ? "bg-primary-50 border border-primary/20" : "hover:bg-gray-50"}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.isRead ? "bg-primary" : "bg-gray-300"}`} />
                  <div>
                    <p className="text-sm text-gray-800">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

import { useEffect, useState } from "react";
import { Users, MessageSquare, ShoppingBag, Wrench, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageLayout, PageHeader } from "../../components/layout";
import { Spinner, Badge, Avatar } from "../../components/ui";
import { userAPI, complaintAPI, listingAPI, serviceAPI } from "../../api/services";

const StatCard = ({ icon: Icon, label, value, sub, color, to }) => (
  <Link to={to} className="card hover:shadow-card-hover transition-all duration-200 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <p className="text-3xl font-extrabold text-gray-900">{value ?? "—"}</p>
    <p className="text-sm font-semibold text-gray-500 mt-1">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </Link>
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [usersRes, complaintStatsRes, recentRes, pendingRes, listingsRes, servicesRes] = await Promise.all([
          userAPI.getAll({ limit: 1 }),
          complaintAPI.getStats(),
          complaintAPI.getAll({ limit: 5 }),
          userAPI.getPending(),
          listingAPI.getAll({ limit: 1 }),
          serviceAPI.getAll({ limit: 1 }),
        ]);
        setStats({
          users: usersRes.data.data.pagination.total,
          complaints: complaintStatsRes.data.data.stats,
          listings: listingsRes.data.data.pagination.total,
          services: servicesRes.data.data.pagination.total,
        });
        setRecentComplaints(recentRes.data.data.complaints);
        setPendingUsers(pendingRes.data.data.users.slice(0, 5));
      } catch { } finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <PageLayout><Spinner /></PageLayout>;

  return (
    <PageLayout>
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-8 mb-8 text-white">
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-semibold mb-1">Society Admin</p>
          <h1 className="text-2xl font-extrabold">Welcome, {user?.name} 👋</h1>
          <p className="text-white/70 text-sm mt-1">Here's what's happening in your society today.</p>
        </div>
        <TrendingUp className="absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 text-white/10" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Residents" value={stats.users} color="bg-primary" to="/admin/residents" />
        <StatCard icon={Clock} label="Pending Complaints" value={stats.complaints?.PENDING} color="bg-yellow-500" to="/admin/complaints" />
        <StatCard icon={CheckCircle} label="Resolved" value={stats.complaints?.RESOLVED} color="bg-green-500" to="/admin/complaints" />
        <StatCard icon={Wrench} label="Services Listed" value={stats.services} color="bg-purple-500" to="/admin/services" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-gray-900">Recent Complaints</h2>
            <Link to="/admin/complaints" className="text-xs text-primary font-semibold hover:underline">View all</Link>
          </div>
          {recentComplaints.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">No complaints yet.</p>
            : <div className="space-y-3">
              {recentComplaints.map((c) => (
                <div key={c._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.createdBy?.name}</p>
                  </div>
                  <Badge label={c.status} />
                </div>
              ))}
            </div>}
        </div>

        {/* Pending Approvals */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-gray-900">Pending Approvals</h2>
            <Link to="/admin/residents?tab=pending" className="text-xs text-primary font-semibold hover:underline">View all</Link>
          </div>
          {pendingUsers.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">No pending approvals.</p>
            : <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                  <Avatar src={u.avatar?.url} name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <Badge label={u.role} />
                </div>
              ))}
            </div>}
        </div>
      </div>
    </PageLayout>
  );
}

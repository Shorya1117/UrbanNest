import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, MessageSquare, Wrench, TrendingUp, CheckCircle, Clock, ArrowUpRight, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PageLayout, PageHeader } from "../../components/layout";
import { Spinner, Badge, Avatar } from "../../components/ui";
import { userAPI, complaintAPI, serviceAPI } from "../../api/services";

const StatCard = ({ icon: Icon, label, value, color, to, trend }) => (
  <Link to={to} className="stat-card block group">
    <div className="flex items-start justify-between mb-5">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: color + "18" }}>
        <Icon size={20} style={{ color }} />
      </div>
      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--text-muted)" }} />
    </div>
    <p className="text-3xl font-bold mb-1" style={{ fontFamily: "Syne", color: "var(--text-primary)" }}>
      {value ?? "—"}
    </p>
    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
  </Link>
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats]           = useState({});
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [pendingUsers, setPendingUsers]         = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [usersRes, complaintsStatsRes, recentRes, pendingRes, servicesRes] = await Promise.all([
          userAPI.getAll({ limit: 1 }),
          complaintAPI.getStats(),
          complaintAPI.getAll({ limit: 5 }),
          userAPI.getPending(),
          serviceAPI.getAll({ limit: 1 }),
        ]);
        setStats({
          users:     usersRes.data.data.pagination?.total,
          complaints: complaintsStatsRes.data.data.stats,
          services:  servicesRes.data.data.pagination?.total,
        });
        setRecentComplaints(recentRes.data.data.complaints);
        setPendingUsers(pendingRes.data.data.users?.slice(0, 4));
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <PageLayout><Spinner /></PageLayout>;

  return (
    <PageLayout>
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl mb-8 p-7"
        style={{ background: "linear-gradient(135deg, #0A1628, #0F2D4A)" }}>
        <div className="absolute top-0 right-0 w-72 h-72 opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, #10B981, transparent)" }} />
        <div className="relative z-10">
          <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>Admin Dashboard</p>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Syne" }}>
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Here's what's happening in your society today.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}        label="Total Residents"   value={stats.users}                     color="#10B981" to="/admin/residents" />
        <StatCard icon={Clock}        label="Pending"           value={stats.complaints?.PENDING}        color="#F59E0B" to="/admin/complaints" />
        <StatCard icon={CheckCircle}  label="Resolved"         value={stats.complaints?.RESOLVED}       color="#3B82F6" to="/admin/complaints" />
        <StatCard icon={Wrench}       label="Services Listed"  value={stats.services}                   color="#8B5CF6" to="/admin/services" />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Recent complaints */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold" style={{ fontFamily: "Syne", color: "var(--text-primary)", fontSize: "16px" }}>
              Recent Complaints
            </h2>
            <Link to="/admin/complaints" className="text-xs font-semibold flex items-center gap-1"
              style={{ color: "var(--emerald)" }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {recentComplaints.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>No complaints yet.</p>
          ) : (
            <div className="space-y-2">
              {recentComplaints.map((c) => (
                <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ cursor: "default" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {c.createdBy?.name} · {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <Badge label={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending approvals */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold" style={{ fontFamily: "Syne", color: "var(--text-primary)", fontSize: "16px" }}>
              Pending Approvals
            </h2>
            {pendingUsers?.length > 0 && (
              <span className="badge badge-yellow">{pendingUsers.length}</span>
            )}
          </div>
          {!pendingUsers?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle size={24} style={{ color: "var(--emerald)" }} className="mb-2" />
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>All residents approved!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div key={u._id} className="flex items-center gap-3">
                  <Avatar src={u.avatar?.url} name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{u.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                  </div>
                  <Badge label={u.role} />
                </div>
              ))}
              <Link to="/admin/residents?tab=pending"
                className="block text-center text-xs font-semibold py-2 rounded-xl mt-2"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                View all →
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
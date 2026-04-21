import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, TrendingUp, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PageLayout, PageHeader } from "../../components/layout";
import { Spinner } from "../../components/ui";
import { societyAPI } from "../../api/services";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await societyAPI.getAll();
        setSocieties(res.data.data.societies);
      } catch { } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const active = societies.filter((s) => s.isActive).length;
  const withAdmin = societies.filter((s) => s.adminId).length;

  return (
    <PageLayout>
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-8 mb-8 text-white">
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-semibold mb-1">Platform Owner</p>
          <h1 className="text-2xl font-extrabold">Welcome, {user?.email} 👋</h1>
          <p className="text-white/70 text-sm mt-1">UrbanNest Super Admin Panel</p>
        </div>
        <TrendingUp className="absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 text-white/10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Societies", value: societies.length, icon: Building2, color: "bg-primary" },
          { label: "Active Societies", value: active, icon: TrendingUp, color: "bg-green-500" },
          { label: "Admins Assigned", value: withAdmin, icon: ShieldCheck, color: "bg-secondary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{loading ? "—" : value}</p>
            <p className="text-sm text-gray-500 font-semibold mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold text-gray-900">All Societies</h2>
          <Link to="/superadmin/societies" className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
            Manage all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? <Spinner size="sm" /> : societies.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No societies created yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {societies.map((s) => (
              <div key={s._id} className="flex items-center gap-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
                  <Building2 size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.address?.city} · <span className="font-mono text-primary">{s.societyCode}</span></p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">{s.adminId ? `Admin: ${s.adminId.name}` : "No admin"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

import React, { useState } from 'react';
import { 
  Building2, Users, Bell, CheckCircle, XCircle, 
  MoreVertical, Activity, ShieldCheck, TrendingUp, Clock,
  Search, Filter, ChevronRight, MapPin
} from 'lucide-react';
import { PageLayout } from '../../components/layout';

export default function Societies2() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock Data
  const stats = [
    { label: 'Total Societies', value: '1,248', change: '+12%', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Users', value: '45.2K', change: '+8%', icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Pending Requests', value: '24', change: '-2%', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Platform Health', value: '99.9%', change: '+0.1%', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const incomingRequests = [
    { id: 1, name: 'Sunrise Valley Apartments', location: 'Mumbai, MH', units: 120, time: '2 hours ago', status: 'Pending Review' },
    { id: 2, name: 'Oceanview Residences', location: 'Chennai, TN', units: 85, time: '5 hours ago', status: 'Pending Review' },
    { id: 3, name: 'Green Park Enclave', location: 'Bangalore, KA', units: 250, time: '1 day ago', status: 'Documents Required' },
  ];

  const activeSocieties = [
    { id: 101, name: 'Prestige Falcon City', location: 'Kanakapura Road, Bangalore', units: 450, admin: 'Rajesh Kumar', health: 'Excellent' },
    { id: 102, name: 'Hiranandani Estate', location: 'Thane West, Mumbai', units: 800, admin: 'Priya Sharma', health: 'Good' },
    { id: 103, name: 'DLF Magnolias', location: 'Sector 42, Gurgaon', units: 300, admin: 'Amit Singh', health: 'Needs Attention' },
    { id: 104, name: 'Lodha Altamount', location: 'Altamount Road, Mumbai', units: 150, admin: 'Sneha Desai', health: 'Excellent' },
  ];

  const notifications = [
    { id: 1, title: 'New Registration', desc: 'Sunrise Valley Apartments applied for registration.', time: '2h ago', type: 'info' },
    { id: 2, title: 'Server Maintenance', desc: 'Scheduled maintenance on Saturday 2 AM.', time: '5h ago', type: 'warning' },
    { id: 3, title: 'Payment Failed', desc: 'Subscription renewal failed for Green Park.', time: '1d ago', type: 'error' },
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50/50 p-6 space-y-8 font-sans">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Society Command Center</h1>
            <p className="text-gray-500 mt-1 text-sm">Monitor, manage, and scale your real estate network seamlessly.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search societies..." 
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm w-64"
              />
            </div>
            <button className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm text-gray-600">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon className={`w-16 h-16 ${stat.color}`} />
              </div>
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <div className="flex items-end gap-2 mt-1">
                  <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                  <span className={`text-sm font-medium mb-1 ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Incoming Requests Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Incoming Requests</h2>
                    <p className="text-xs text-gray-500">Needs your approval to onboard</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{req.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center text-xs text-gray-500">
                            <MapPin className="w-3 h-3 mr-1" /> {req.location}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-xs text-gray-500">{req.units} Units</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors" title="Approve">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors" title="Reject">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Societies Directory */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Managed Societies</h2>
                    <p className="text-xs text-gray-500">Overview of onboarded properties</p>
                  </div>
                </div>
                <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSocieties.map((soc) => (
                  <div key={soc.id} className="border border-gray-100 p-5 rounded-2xl hover:border-blue-100 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center border border-blue-100/50">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{soc.name}</h4>
                          <p className="text-xs text-gray-500 truncate w-40">{soc.location}</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Admin</p>
                        <p className="text-xs font-medium text-gray-800">{soc.admin}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Health Status</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          soc.health === 'Excellent' ? 'bg-green-100 text-green-700' : 
                          soc.health === 'Good' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {soc.health}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            
            {/* System Notifications */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-400" /> Notifications
              </h2>
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex gap-3 items-start relative before:absolute before:left-[11px] before:top-8 before:bottom-[-16px] before:w-[2px] before:bg-gray-100 last:before:hidden">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      notif.type === 'info' ? 'bg-blue-100 text-blue-600' : 
                      notif.type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-current"></span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{notif.desc}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
                View All Notifications
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <h2 className="text-lg font-bold mb-2">Platform Performance</h2>
                <p className="text-indigo-200 text-sm mb-6">Everything is running smoothly. Resource usage is optimal.</p>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-indigo-100">Server Load</span>
                      <span className="font-bold">24%</span>
                    </div>
                    <div className="w-full bg-indigo-950/50 rounded-full h-1.5">
                      <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-indigo-100">Database Capacity</span>
                      <span className="font-bold">68%</span>
                    </div>
                    <div className="w-full bg-indigo-950/50 rounded-full h-1.5">
                      <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                </div>

                <button className="w-full mt-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors backdrop-blur-sm">
                  View Detailed Metrics
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}

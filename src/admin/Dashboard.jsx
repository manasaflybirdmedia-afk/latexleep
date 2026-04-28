import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ShoppingBag, Users, AlertTriangle, IndianRupee, Package, ArrowRight } from "lucide-react";
import { orders as ordersApi } from "../lib/api.js";
import { formatPrice, formatDate, getStatusColor, getStatusLabel, resolveAssetUrl } from "../lib/utils.js";

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-sm text-muted-foreground">{label}</p>
          <p className="font-heading text-3xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="font-body text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.adminStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent" />
    </div>
  );

  if (!stats) return <p className="text-muted-foreground">Failed to load dashboard data</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="font-body text-muted-foreground">Overview of your store performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Revenue" value={formatPrice(stats.totalRevenue)} icon={IndianRupee} color="bg-green-500" sub={`Today: ${formatPrice(stats.todayRevenue)}`} />
        <StatCard label="Total Orders" value={stats.totalOrders} icon={ShoppingBag} color="bg-blue-500" sub={`${stats.pendingOrders} pending`} />
        <StatCard label="Customers" value={stats.totalCustomers} icon={Users} color="bg-purple-500" />
        <StatCard label="Low Stock" value={stats.lowStockProducts} icon={AlertTriangle} color={stats.lowStockProducts > 0 ? "bg-amber-500" : "bg-gray-400"} sub={stats.lowStockProducts > 0 ? "Needs attention" : "All good"} />
      </div>

      {/* Revenue (week / month) */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="stat-card">
          <p className="font-body text-sm text-muted-foreground">This Week Revenue</p>
          <p className="font-heading text-3xl font-bold text-foreground">{formatPrice(stats.weekRevenue)}</p>
        </div>
        <div className="stat-card">
          <p className="font-body text-sm text-muted-foreground">This Month Revenue</p>
          <p className="font-heading text-3xl font-bold text-foreground">{formatPrice(stats.monthRevenue)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-lg font-bold text-foreground">Recent Orders</h2>
            <Link to="/admin/orders" className="font-body text-sm text-accent hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          {stats.recentOrders?.length === 0 ? (
            <p className="text-muted-foreground font-body text-sm">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders?.map((o) => (
                <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 hover:opacity-80 transition-opacity">
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">{o.order_number}</p>
                    <p className="font-body text-xs text-muted-foreground">{o.customer_name || "Guest"} • {formatDate(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className={getStatusColor(o.status)}>{getStatusLabel(o.status)}</span>
                    <p className="font-body font-semibold text-sm mt-1">{formatPrice(o.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-lg font-bold text-foreground">Top Products</h2>
            <Link to="/admin/products" className="font-body text-sm text-accent hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {stats.topProducts?.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-body text-xs font-bold text-muted-foreground shrink-0">{i + 1}</span>
                <img src={resolveAssetUrl(p.primary_image || "/assets/hero-bedroom.jpg")} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" onError={(e) => { e.target.src = "/assets/hero-bedroom.jpg"; }} />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{p.sold_count} sold</p>
                </div>
                <p className="font-body font-semibold text-sm">{formatPrice(p.discount_price || p.price)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low stock alert */}
      {stats.lowStockProducts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-600" />
            <div>
              <p className="font-body font-semibold text-amber-800">{stats.lowStockProducts} products are running low on stock</p>
              <p className="font-body text-sm text-amber-700">Check inventory to avoid stockouts</p>
            </div>
          </div>
          <Link to="/admin/inventory" className="btn-outline text-sm py-2 shrink-0">View Inventory</Link>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { User, Package, MapPin, Heart, Settings, ChevronRight, Check, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { orders as ordersApi, customers as customersApi } from "../lib/api.js";
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from "../lib/utils.js";
import toast from "react-hot-toast";

const TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "orders", label: "My Orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function UserDashboard() {
  const { tab = "overview" } = useParams();
  const { user, updateUser, logout } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [passwords, setPasswords] = useState({ current: "", new_password: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const showSuccess = location.state?.success;

  useEffect(() => {
    if (tab === "orders" || tab === "overview") ordersApi.myOrders().then((d) => setOrders(d.orders)).catch(() => {});
    if (tab === "addresses") customersApi.getAddresses().then((d) => setAddresses(d.addresses)).catch(() => {});
    if (tab === "wishlist") customersApi.getWishlist().then((d) => setWishlist(d.items)).catch(() => {});
  }, [tab]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { user: updated } = await (await import("../lib/api.js")).auth.updateProfile(profile);
      updateUser(updated);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    try {
      await (await import("../lib/api.js")).auth.changePassword({ current_password: passwords.current, new_password: passwords.new_password });
      toast.success("Password changed!");
      setPasswords({ current: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      {showSuccess && (
        <div className="bg-green-50 border-b border-green-200 py-3">
          <div className="container mx-auto px-6 flex items-center gap-2 text-green-700 font-body text-sm font-medium">
            <Check size={16} />Order placed successfully! We'll update you on your order status.
          </div>
        </div>
      )}

      <div className="bg-secondary border-b border-border py-8">
        <div className="container mx-auto px-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">My Account</h1>
          <p className="font-body text-muted-foreground">{user?.name} • {user?.email}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            <div className="card overflow-hidden">
              {TABS.map((t) => (
                <Link key={t.id} to={`/dashboard/${t.id}`} className={`flex items-center gap-3 px-4 py-3.5 font-body text-sm font-medium transition-colors border-b border-border last:border-0 ${tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"}`}>
                  <t.icon size={16} />{t.label}
                </Link>
              ))}
              <button onClick={logout} className="w-full text-left flex items-center gap-3 px-4 py-3.5 font-body text-sm font-medium text-destructive hover:bg-secondary transition-colors">
                Logout
              </button>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {/* Overview */}
            {(tab === "overview" || tab === undefined) && (
              <div>
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  <div className="stat-card">
                    <p className="font-body text-sm text-muted-foreground">Total Orders</p>
                    <p className="font-heading text-3xl font-bold text-foreground">{orders.length}</p>
                  </div>
                  <div className="stat-card">
                    <p className="font-body text-sm text-muted-foreground">Delivered</p>
                    <p className="font-heading text-3xl font-bold text-green-600">{orders.filter((o) => o.status === "delivered").length}</p>
                  </div>
                  <div className="stat-card">
                    <p className="font-body text-sm text-muted-foreground">Total Spent</p>
                    <p className="font-heading text-3xl font-bold text-accent">{formatPrice(orders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total, 0))}</p>
                  </div>
                </div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-4">Recent Orders</h2>
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="card p-4 mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-body font-semibold text-sm text-foreground">{o.order_number}</p>
                      <p className="font-body text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                    </div>
                    <span className={getStatusColor(o.status)}>{getStatusLabel(o.status)}</span>
                    <p className="font-heading font-bold text-foreground">{formatPrice(o.total)}</p>
                    <Link to={`/dashboard/orders/${o.id}`} className="text-accent hover:underline font-body text-sm">View</Link>
                  </div>
                ))}
                {orders.length === 0 && <p className="font-body text-muted-foreground">No orders yet.</p>}
              </div>
            )}

            {/* Orders */}
            {tab === "orders" && (
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-6">Order History</h2>
                {orders.length === 0 ? (
                  <div className="card p-12 text-center">
                    <Package size={40} className="text-muted-foreground mx-auto mb-3" />
                    <p className="font-heading text-lg font-semibold text-foreground mb-2">No orders yet</p>
                    <Link to="/products" className="btn-primary text-sm">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => (
                      <Link key={o.id} to={`/dashboard/orders/${o.id}`} className="card p-5 flex flex-wrap items-center justify-between gap-4 hover:shadow-md transition-shadow">
                        <div>
                          <p className="font-body font-bold text-foreground">{o.order_number}</p>
                          <p className="font-body text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                        </div>
                        <span className={getStatusColor(o.status)}>{getStatusLabel(o.status)}</span>
                        <span className={getStatusColor(o.payment_status)}>{getStatusLabel(o.payment_status)}</span>
                        <p className="font-heading font-bold text-foreground">{formatPrice(o.total)}</p>
                        <ChevronRight size={18} className="text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses */}
            {tab === "addresses" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-xl font-bold text-foreground">Saved Addresses</h2>
                </div>
                {addresses.length === 0 ? (
                  <div className="card p-12 text-center">
                    <MapPin size={40} className="text-muted-foreground mx-auto mb-3" />
                    <p className="font-body text-muted-foreground">No saved addresses</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {addresses.map((a) => (
                      <div key={a.id} className="card p-5">
                        {a.is_default === 1 && <span className="badge badge-success mb-2">Default</span>}
                        <p className="font-body font-semibold text-foreground">{a.name}</p>
                        <p className="font-body text-sm text-muted-foreground mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                        <p className="font-body text-sm text-muted-foreground">{a.city}, {a.state} - {a.pincode}</p>
                        <p className="font-body text-sm text-muted-foreground">{a.phone}</p>
                        <button onClick={() => customersApi.deleteAddress(a.id).then(() => setAddresses((arr) => arr.filter((x) => x.id !== a.id)))} className="mt-3 font-body text-xs text-destructive hover:underline">Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            {tab === "settings" && (
              <div className="space-y-8">
                <div className="card p-6">
                  <h2 className="font-heading text-xl font-bold text-foreground mb-6">Profile Settings</h2>
                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                    <div><label className="label">Full Name</label><input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className="input-field" /></div>
                    <div><label className="label">Phone</label><input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} className="input-field" /></div>
                    <div><label className="label">Email</label><input value={user?.email} disabled className="input-field opacity-60 cursor-not-allowed" /></div>
                    <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save Changes"}</button>
                  </form>
                </div>

                <div className="card p-6">
                  <h2 className="font-heading text-xl font-bold text-foreground mb-6">Change Password</h2>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div><label className="label">Current Password</label><input type="password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} className="input-field" /></div>
                    <div><label className="label">New Password</label><input type="password" value={passwords.new_password} onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))} className="input-field" /></div>
                    <div><label className="label">Confirm Password</label><input type="password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} className="input-field" /></div>
                    <button type="submit" disabled={saving} className="btn-primary">{saving ? "Changing..." : "Change Password"}</button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

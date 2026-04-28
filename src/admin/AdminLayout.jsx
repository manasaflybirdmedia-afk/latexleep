import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users, Ticket, Layers,
  Settings, Menu, X, LogOut, Bell, ChevronDown, Warehouse, UserCog
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { ROLES, ROLE_COLORS } from "../lib/utils.js";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/team", label: "Team", icon: UserCog, roles: ["super_admin", "admin"] },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { admin, adminLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  const visibleNav = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(admin?.role));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} bg-primary flex flex-col shrink-0 transition-all duration-300 fixed h-full z-40 overflow-hidden`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && <span className="font-heading text-xl font-bold text-primary-foreground">LATEX <span className="text-accent">Leep</span></span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-primary-foreground/60 hover:text-primary-foreground p-1 ml-auto">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {visibleNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm font-medium transition-all ${isActive ? "bg-white/20 text-primary-foreground" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10"}`}>
              <item.icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <span className="font-heading font-bold text-accent-foreground text-sm">{admin?.name?.[0] || "A"}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-semibold text-primary-foreground truncate">{admin?.name}</p>
                <span className={`text-xs ${ROLE_COLORS[admin?.role]}`}>{ROLES[admin?.role]}</span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={handleLogout} className="mt-3 w-full flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground text-sm font-body py-2 px-2 rounded-lg hover:bg-white/10 transition-colors">
              <LogOut size={16} />Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? "ml-60" : "ml-16"} transition-all duration-300`}>
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
          <h2 className="font-heading font-semibold text-foreground text-lg hidden md:block">Admin Panel</h2>
          <div className="flex items-center gap-4 ml-auto">
            <a href="/" target="_blank" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">View Store ↗</a>
            <span className="font-body text-sm font-medium text-foreground">{admin?.name}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

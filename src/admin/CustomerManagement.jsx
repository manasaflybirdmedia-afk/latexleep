import React, { useEffect, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { customers as customersApi } from "../lib/api.js";
import { formatPrice, formatDate } from "../lib/utils.js";

export default function CustomerManagement() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchUsers = (page = 1) => {
    setLoading(true);
    customersApi.adminAll({ page, search })
      .then((d) => { setUsers(d.users); setPagination(d.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const handleSelect = (userId) => {
    customersApi.adminGet(userId).then((d) => setSelected(d.user)).catch(() => {});
  };

  if (selected) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />Back to customers
        </button>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="card p-5">
            <h3 className="font-body font-semibold text-sm text-muted-foreground uppercase mb-3">Customer Info</h3>
            <p className="font-body font-bold text-foreground">{selected.name}</p>
            <p className="font-body text-sm text-muted-foreground">{selected.email}</p>
            <p className="font-body text-sm text-muted-foreground">{selected.phone}</p>
            <p className="font-body text-xs text-muted-foreground mt-2">Joined {formatDate(selected.created_at)}</p>
          </div>
          <div className="card p-5">
            <p className="font-body text-sm text-muted-foreground mb-1">Total Orders</p>
            <p className="font-heading text-3xl font-bold">{selected.orders?.length || 0}</p>
          </div>
          <div className="card p-5">
            <p className="font-body text-sm text-muted-foreground mb-1">Total Spent</p>
            <p className="font-heading text-3xl font-bold text-accent">{formatPrice(selected.orders?.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total, 0) || 0)}</p>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-body font-semibold text-foreground mb-4">Recent Orders</h3>
          {!selected.orders?.length ? <p className="text-muted-foreground text-sm">No orders</p> :
            <div className="table-container"><table className="table">
              <thead><tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>{selected.orders.map((o) => (
                <tr key={o.id}><td className="font-semibold">{o.order_number}</td><td className="text-sm text-muted-foreground">{formatDate(o.created_at)}</td><td>{formatPrice(o.total)}</td><td><span className="badge badge-info">{o.status}</span></td></tr>
              ))}</tbody>
            </table></div>
          }
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Customers</h1>
        <p className="font-body text-muted-foreground">{pagination.total} registered customers</p>
      </div>
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 py-2" />
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7}><div className="h-8 bg-secondary animate-pulse rounded" /></td></tr>)
              : users.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.name}</td>
                  <td className="text-muted-foreground text-sm">{u.email}</td>
                  <td className="text-sm">{u.phone || "—"}</td>
                  <td>{u.order_count}</td>
                  <td>{formatPrice(u.total_spent)}</td>
                  <td className="text-sm text-muted-foreground">{formatDate(u.created_at)}</td>
                  <td><button onClick={() => handleSelect(u.id)} className="text-accent text-sm hover:underline">View</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {pagination.pages > 1 && (
        <div className="flex gap-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i} onClick={() => fetchUsers(i + 1)} className={`w-9 h-9 rounded-lg text-sm font-semibold ${pagination.page === i + 1 ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"}`}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}

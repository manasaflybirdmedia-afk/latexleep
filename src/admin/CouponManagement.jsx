import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { coupons as couponsApi } from "../lib/api.js";
import { formatDate } from "../lib/utils.js";
import toast from "react-hot-toast";

const EMPTY = { code: "", type: "percentage", value: "", min_order_amount: "", max_discount: "", usage_limit: "", expires_at: "", is_active: true };

export default function CouponManagement() {
  const [couponList, setCouponList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch = () => { setLoading(true); couponsApi.adminList().then((d) => setCouponList(d.coupons)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const openEdit = (c) => {
    setEditing(c);
    setForm({ code: c.code, type: c.type, value: c.value, min_order_amount: c.min_order_amount || "", max_discount: c.max_discount || "", usage_limit: c.usage_limit || "", expires_at: c.expires_at ? new Date(c.expires_at * 1000).toISOString().slice(0, 10) : "", is_active: c.is_active === 1 });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) { toast.error("Code and value required"); return; }
    setSaving(true);
    try {
      if (editing) { await couponsApi.update(editing.id, form); toast.success("Updated!"); }
      else { await couponsApi.create(form); toast.success("Coupon created!"); }
      setShowForm(false);
      fetch();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    await couponsApi.delete(id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-heading text-2xl font-bold">Coupons</h1></div>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} />New Coupon</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Uses</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={8}><div className="h-8 bg-secondary animate-pulse rounded" /></td></tr>)
              : couponList.map((c) => (
                <tr key={c.id}>
                  <td className="font-bold tracking-wider">{c.code}</td>
                  <td className="capitalize">{c.type}</td>
                  <td className="font-semibold">{c.type === "percentage" ? `${c.value}%` : `₹${c.value}`}</td>
                  <td>₹{c.min_order_amount || 0}</td>
                  <td>{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</td>
                  <td className="text-muted-foreground text-sm">{c.expires_at ? formatDate(c.expires_at) : "No expiry"}</td>
                  <td><span className={c.is_active ? "badge-success" : "badge-gray"}>{c.is_active ? "Active" : "Inactive"}</span></td>
                  <td><div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-700"><Edit size={15} /></button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-600"><Trash2 size={15} /></button>
                  </div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-lg font-bold">{editing ? "Edit Coupon" : "New Coupon"}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div><label className="label">Coupon Code *</label><input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="input-field font-bold tracking-wider" placeholder="e.g. SAVE20" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Type *</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input-field">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div><label className="label">Value *</label><input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} className="input-field" placeholder={form.type === "percentage" ? "10" : "200"} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Min Order (₹)</label><input type="number" value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))} className="input-field" /></div>
                <div><label className="label">Max Discount (₹)</label><input type="number" value={form.max_discount} onChange={(e) => setForm((f) => ({ ...f, max_discount: e.target.value }))} className="input-field" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Usage Limit</label><input type="number" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))} className="input-field" /></div>
                <div><label className="label">Expires On</label><input type="date" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} className="input-field" /></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-accent w-4 h-4" />
                <span className="font-body text-sm">Active</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving..." : "Save Coupon"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { AlertTriangle, Plus, Minus, RefreshCw, X } from "lucide-react";
import { inventory as inventoryApi } from "../lib/api.js";
import toast from "react-hot-toast";

export default function InventoryManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ type: "add", quantity: "", note: "" });
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    setLoading(true);
    inventoryApi.list().then((d) => setProducts(d.products)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const lowStockCount = products.filter((p) => p.is_low_stock).length;

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustForm.quantity) { toast.error("Quantity required"); return; }
    setSaving(true);
    try {
      await inventoryApi.adjust(adjustingProduct.id, adjustForm);
      toast.success("Stock adjusted!");
      setAdjustingProduct(null);
      setAdjustForm({ type: "add", quantity: "", note: "" });
      fetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Inventory</h1>
          <p className="font-body text-muted-foreground">Manage stock levels for all products</p>
        </div>
        <button onClick={fetch} className="btn-outline flex items-center gap-2 py-2 text-sm"><RefreshCw size={15} />Refresh</button>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <p className="font-body text-sm text-amber-700 font-semibold">{lowStockCount} product{lowStockCount > 1 ? "s" : ""} running low on stock</p>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Threshold</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? [...Array(6)].map((_, i) => <tr key={i}><td colSpan={7}><div className="h-8 bg-secondary animate-pulse rounded" /></td></tr>)
              : products.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-xs text-muted-foreground">{p.sku}</td>
                  <td>{p.category_name || "—"}</td>
                  <td><span className={`font-bold text-lg ${p.is_low_stock ? "text-red-600" : "text-green-600"}`}>{p.stock}</span></td>
                  <td className="text-muted-foreground">{p.low_stock_threshold}</td>
                  <td>
                    {p.stock === 0 ? <span className="badge-danger">Out of Stock</span>
                      : p.is_low_stock ? <span className="badge-warning flex items-center gap-1"><AlertTriangle size={10} />Low Stock</span>
                      : <span className="badge-success">In Stock</span>}
                  </td>
                  <td>
                    <button onClick={() => setAdjustingProduct(p)} className="text-accent text-sm font-semibold hover:underline">Adjust</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {adjustingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-lg font-bold">Adjust Stock</h2>
              <button onClick={() => setAdjustingProduct(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdjust} className="p-5 space-y-4">
              <div className="bg-secondary rounded-lg p-3">
                <p className="font-body font-semibold text-foreground">{adjustingProduct.name}</p>
                <p className="font-body text-sm text-muted-foreground">Current stock: <span className="font-bold text-foreground">{adjustingProduct.stock}</span></p>
              </div>
              <div>
                <label className="label">Adjustment Type</label>
                <select value={adjustForm.type} onChange={(e) => setAdjustForm((f) => ({ ...f, type: e.target.value }))} className="input-field">
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                  <option value="adjustment">Set Exact Value</option>
                </select>
              </div>
              <div>
                <label className="label">Quantity *</label>
                <input type="number" min="0" value={adjustForm.quantity} onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))} className="input-field" placeholder="Enter quantity" />
              </div>
              <div>
                <label className="label">Note</label>
                <input value={adjustForm.note} onChange={(e) => setAdjustForm((f) => ({ ...f, note: e.target.value }))} className="input-field" placeholder="Reason for adjustment" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setAdjustingProduct(null)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving..." : "Update Stock"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Star, ToggleLeft, ToggleRight, Search, X } from "lucide-react";
import { products as productsApi, categories as categoriesApi } from "../lib/api.js";
import { formatPrice } from "../lib/utils.js";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  name: "", description: "", short_description: "", price: "", discount_price: "",
  sku: "", category_id: "", stock: "", low_stock_threshold: "5", is_featured: false,
  is_active: true, tags: "", features: [""],
};

export default function ProductManagement() {
  const [productList, setProductList] = useState([]);
  const [cats, setCats] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchProducts = (page = 1) => {
    setLoading(true);
    productsApi.adminList({ page, search, limit: 20 })
      .then((d) => { setProductList(d.products); setPagination(d.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [search]);
  useEffect(() => { categoriesApi.list().then((d) => setCats(d.categories)).catch(() => {}); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setImages([]); setShowForm(true); };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || "", short_description: p.short_description || "",
      price: p.price, discount_price: p.discount_price || "", sku: p.sku,
      category_id: p.category_id || "", stock: p.stock, low_stock_threshold: p.low_stock_threshold || 5,
      is_featured: p.is_featured === 1, is_active: p.is_active === 1, tags: p.tags || "",
      features: p.features?.length > 0 ? p.features : [""],
    });
    setImages([]);
    setShowForm(true);
  };

  const handleFeatureChange = (i, val) => setForm((f) => { const feats = [...f.features]; feats[i] = val; return { ...f, features: feats }; });
  const addFeature = () => setForm((f) => ({ ...f, features: [...f.features, ""] }));
  const removeFeature = (i) => setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.sku) { toast.error("Name, price and SKU are required"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "features") fd.append(k, JSON.stringify(v.filter(Boolean)));
        else if (k !== "images") fd.append(k, String(v));
      });
      images.forEach((f) => fd.append("images", f));

      if (editing) {
        await productsApi.update(editing.id, fd);
        toast.success("Product updated!");
      } else {
        await productsApi.create(fd);
        toast.success("Product created!");
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await productsApi.delete(id);
      toast.success("Product deleted");
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleFeatured = async (p) => {
    try {
      await productsApi.toggleFeatured(p.id);
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Products</h1>
          <p className="font-body text-muted-foreground">{pagination.total} total products</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={18} />Add Product</button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 py-2" />
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Featured</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => <tr key={i}><td colSpan={8}><div className="h-8 bg-secondary animate-pulse rounded" /></td></tr>)
            ) : productList.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No products found</td></tr>
            ) : productList.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <img src={p.primary_image || "/assets/hero-bedroom.jpg"} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" onError={(e) => { e.target.src = "/assets/hero-bedroom.jpg"; }} />
                    <span className="font-body font-medium text-foreground">{p.name}</span>
                  </div>
                </td>
                <td className="text-muted-foreground text-xs">{p.sku}</td>
                <td>{p.category_name || "—"}</td>
                <td>
                  <p className="font-semibold">{formatPrice(p.discount_price || p.price)}</p>
                  {p.discount_price && <p className="text-xs text-muted-foreground line-through">{formatPrice(p.price)}</p>}
                </td>
                <td>
                  <span className={`font-semibold ${p.stock <= p.low_stock_threshold ? "text-red-600" : "text-green-600"}`}>{p.stock}</span>
                </td>
                <td>
                  <button onClick={() => handleToggleFeatured(p)} className="text-accent hover:text-accent/70 transition-colors">
                    {p.is_featured ? <ToggleRight size={22} /> : <ToggleLeft size={22} className="text-muted-foreground" />}
                  </button>
                </td>
                <td><span className={p.is_active ? "badge-success" : "badge-gray"}>{p.is_active ? "Active" : "Inactive"}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-700"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex gap-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i} onClick={() => fetchProducts(i + 1)} className={`w-9 h-9 rounded-lg text-sm font-semibold ${pagination.page === i + 1 ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-heading text-xl font-bold">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="label">Product Name *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" /></div>
                <div><label className="label">SKU *</label><input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="input-field" /></div>
                <div><label className="label">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className="input-field">
                    <option value="">— Select —</option>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Price (₹) *</label><input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="input-field" /></div>
                <div><label className="label">Discount Price (₹)</label><input type="number" value={form.discount_price} onChange={(e) => setForm((f) => ({ ...f, discount_price: e.target.value }))} className="input-field" /></div>
                <div><label className="label">Stock Quantity</label><input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="input-field" /></div>
                <div><label className="label">Low Stock Alert</label><input type="number" value={form.low_stock_threshold} onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))} className="input-field" /></div>
              </div>
              <div><label className="label">Short Description</label><input value={form.short_description} onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))} className="input-field" /></div>
              <div><label className="label">Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="input-field resize-none" /></div>
              <div><label className="label">Tags (comma-separated)</label><input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className="input-field" /></div>

              {/* Features */}
              <div>
                <label className="label">Key Features</label>
                <div className="space-y-2">
                  {form.features.map((feat, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={feat} onChange={(e) => handleFeatureChange(i, e.target.value)} placeholder={`Feature ${i + 1}`} className="input-field flex-1" />
                      <button type="button" onClick={() => removeFeature(i)} className="text-red-500 hover:text-red-600 px-2"><X size={16} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addFeature} className="text-accent text-sm font-semibold hover:underline">+ Add feature</button>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="label">Product Images</label>
                <input type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files))} className="input-field" />
                {images.length > 0 && <p className="text-xs text-muted-foreground mt-1">{images.length} image(s) selected</p>}
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} className="accent-accent w-4 h-4" />
                  <span className="font-body text-sm">Featured Product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-accent w-4 h-4" />
                  <span className="font-body text-sm">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving..." : editing ? "Update Product" : "Create Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { categories as categoriesApi } from "../lib/api.js";
import toast from "react-hot-toast";

export default function CategoryManagement() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", sort_order: "0", is_active: true });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    setLoading(true);
    categoriesApi.adminList().then((d) => setCats(d.categories)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "", sort_order: c.sort_order || 0, is_active: c.is_active === 1 });
    setImageFile(null);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", sort_order: "0", is_active: true });
    setImageFile(null);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error("Category name is required"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("sort_order", form.sort_order);
      fd.append("is_active", form.is_active);
      if (imageFile) fd.append("image", imageFile);

      if (editing) {
        await categoriesApi.update(editing.id, fd);
        toast.success("Category updated!");
      } else {
        await categoriesApi.create(fd);
        toast.success("Category created!");
      }
      setShowForm(false);
      fetch();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await categoriesApi.delete(id);
      toast.success("Deleted");
      fetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-heading text-2xl font-bold text-foreground">Categories</h1></div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={18} />Add Category</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="card h-40 animate-pulse bg-secondary" />) : cats.map((c) => (
          <div key={c.id} className="card overflow-hidden group">
            <div className="h-32 bg-secondary relative overflow-hidden">
              <img src={c.image || "/assets/hero-bedroom.jpg"} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.src = "/assets/hero-bedroom.jpg"; }} />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(c)} className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50"><Edit size={13} /></button>
                <button onClick={() => handleDelete(c.id)} className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <p className="font-body font-semibold text-foreground">{c.name}</p>
                <span className={c.is_active ? "badge-success text-xs" : "badge-gray text-xs"}>{c.is_active ? "Active" : "Off"}</span>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-1">{c.product_count} products</p>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-lg font-bold">{editing ? "Edit Category" : "Add Category"}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div><label className="label">Name *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" /></div>
              <div><label className="label">Description</label><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field" /></div>
              <div><label className="label">Sort Order</label><input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} className="input-field" /></div>
              <div><label className="label">Image</label><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="input-field" /></div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-accent w-4 h-4" />
                <span className="font-body text-sm">Active</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

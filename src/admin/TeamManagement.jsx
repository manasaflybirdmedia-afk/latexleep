import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X, Copy, Check } from "lucide-react";
import { team as teamApi } from "../lib/api.js";
import { formatDate, ROLES, ROLE_COLORS } from "../lib/utils.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import toast from "react-hot-toast";

const EMPTY = { name: "", email: "", role: "manager", password: "" };
const EDITABLE_ROLES = ["admin", "manager", "inventory_staff", "support_staff"];

export default function TeamManagement() {
  const { admin } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetch = () => {
    setLoading(true);
    teamApi.list()
      .then((d) => setMembers(d.members))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setTempPassword(null);
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({ name: m.name, email: m.email, role: m.role, is_active: m.is_active === 1 });
    setTempPassword(null);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role) {
      toast.error("Name, email and role required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await teamApi.update(editing.id, { name: form.name, role: form.role, is_active: form.is_active });
        toast.success("Member updated!");
        setShowForm(false);
      } else {
        const data = await teamApi.create({ name: form.name, email: form.email, role: form.role, password: form.password || undefined });
        toast.success("Team member created!");
        setTempPassword(data.temp_password);
      }
      fetch();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === admin?.id) { toast.error("Cannot delete yourself"); return; }
    if (!confirm("Remove this team member?")) return;
    try {
      await teamApi.delete(id);
      toast.success("Member removed");
      fetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleActive = async (m) => {
    try {
      await teamApi.update(m.id, { name: m.name, role: m.role, is_active: m.is_active !== 1 });
      fetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Team</h1>
          <p className="font-body text-muted-foreground">Manage admin team members and roles</p>
        </div>
        {admin?.role === "super_admin" && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={18} />Add Member
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last Login</th>
              <th>Status</th>
              {admin?.role === "super_admin" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={6}><div className="h-8 bg-secondary animate-pulse rounded" /></td></tr>
              ))
            ) : members.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No team members</td></tr>
            ) : members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="font-heading text-sm font-bold text-primary-foreground">{m.name?.[0]}</span>
                    </div>
                    <span className="font-body font-medium text-foreground">{m.name}</span>
                    {m.id === admin?.id && <span className="badge-info text-xs">You</span>}
                  </div>
                </td>
                <td className="text-muted-foreground text-sm">{m.email}</td>
                <td><span className={ROLE_COLORS[m.role]}>{ROLES[m.role] || m.role}</span></td>
                <td className="text-muted-foreground text-sm">{m.last_login ? formatDate(m.last_login) : "Never"}</td>
                <td>
                  <span className={m.is_active ? "badge-success" : "badge-gray"}>
                    {m.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                {admin?.role === "super_admin" && (
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(m)} className="text-blue-600 hover:text-blue-700" title="Edit">
                        <Edit size={15} />
                      </button>
                      {m.role !== "super_admin" && m.id !== admin?.id && (
                        <>
                          <button onClick={() => handleToggleActive(m)} className="text-amber-500 hover:text-amber-600 text-xs font-semibold" title="Toggle active">
                            {m.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-600" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-lg font-bold">{editing ? "Edit Member" : "Add Team Member"}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>

            {/* Temp password display after create */}
            {tempPassword && (
              <div className="p-5 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="font-body text-sm font-semibold text-green-800 mb-2">Member created! Share this temporary password:</p>
                  <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2">
                    <code className="flex-1 font-mono text-sm text-foreground">{tempPassword}</code>
                    <button onClick={copyPassword} className="text-green-700 hover:text-green-800">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="font-body text-xs text-green-700 mt-2">They will be asked to change password on first login.</p>
                </div>
                <button onClick={() => setShowForm(false)} className="btn-primary w-full">Done</button>
              </div>
            )}

            {!tempPassword && (
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" placeholder="e.g. Ravi Kumar" />
                </div>
                {!editing && (
                  <div>
                    <label className="label">Email Address *</label>
                    <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input-field" placeholder="ravi@latexleep.com" />
                  </div>
                )}
                <div>
                  <label className="label">Role *</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="input-field">
                    {EDITABLE_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLES[r]}</option>
                    ))}
                  </select>
                </div>
                {!editing && (
                  <div>
                    <label className="label">Password (optional)</label>
                    <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="input-field" placeholder="Auto-generate if blank" />
                  </div>
                )}
                {editing && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-accent w-4 h-4" />
                    <span className="font-body text-sm">Active</span>
                  </label>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? "Saving..." : editing ? "Update" : "Create Member"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

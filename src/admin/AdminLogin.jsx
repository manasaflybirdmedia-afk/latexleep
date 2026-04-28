import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { adminLogin, admin } = useAuth();
  const navigate = useNavigate();

  if (admin) { navigate("/admin", { replace: true }); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Email and password required"); return; }
    setLoading(true);
    try {
      const data = await adminLogin(email, password);
      if (data.admin.force_password_change) {
        toast("Please change your password", { icon: "🔐" });
        navigate("/admin/change-password");
      } else {
        toast.success(`Welcome, ${data.admin.name}!`);
        navigate("/admin");
      }
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-accent" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-primary-foreground">LATEX <span className="text-accent">Leep</span></h1>
          <p className="font-body text-primary-foreground/60 mt-2">Admin Dashboard</p>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-8">
          <h2 className="font-heading text-xl font-bold text-foreground mb-6">Sign in to Admin</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="admin@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-10" placeholder="Your password" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Signing in..." : "Sign In"}</button>
          </form>
          <p className="font-body text-xs text-muted-foreground text-center mt-4">Default: admin@example.com / Admin@12345</p>
        </div>
      </div>
    </div>
  );
}

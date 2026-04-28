import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  if (user) { navigate("/"); return null; }

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("Name, email and password are required"); return; }
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      toast.success("Account created successfully!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-heading text-3xl font-bold text-foreground">LATEX <span className="text-accent">Leep</span></Link>
          <h1 className="font-heading text-2xl font-bold text-foreground mt-4">Create account</h1>
          <p className="font-body text-muted-foreground mt-1">Join thousands of happy customers</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input name="name" type="text" value={form.name} onChange={handleChange} className="input-field" placeholder="Your full name" autoComplete="name" />
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" placeholder="you@email.com" autoComplete="email" />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="input-field" placeholder="10-digit mobile" autoComplete="tel" />
            </div>
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange} className="input-field pr-10" placeholder="Min 6 characters" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password *</label>
              <input name="confirm" type="password" value={form.confirm} onChange={handleChange} className="input-field" placeholder="Repeat password" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Creating account..." : "Create Account"}</button>
          </form>

          <p className="font-body text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

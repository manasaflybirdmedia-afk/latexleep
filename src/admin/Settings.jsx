import React, { useEffect, useState } from "react";
import { Save, RefreshCw, Users } from "lucide-react";
import { settings as settingsApi } from "../lib/api.js";
import { formatDate } from "../lib/utils.js";
import toast from "react-hot-toast";

const SECTIONS = [
  {
    title: "Store Information",
    keys: ["store_name", "store_tagline", "store_email", "store_phone", "store_address"],
    labels: { store_name: "Store Name", store_tagline: "Tagline", store_email: "Email", store_phone: "Phone", store_address: "Address" },
  },
  {
    title: "Currency & Pricing",
    keys: ["store_currency", "store_currency_symbol", "free_shipping_threshold", "default_shipping_charge", "tax_rate", "gst_number"],
    labels: { store_currency: "Currency Code", store_currency_symbol: "Currency Symbol", free_shipping_threshold: "Free Shipping Above (₹)", default_shipping_charge: "Default Shipping Charge (₹)", tax_rate: "Tax Rate (%)", gst_number: "GST Number" },
  },
  {
    title: "Social & Contact",
    keys: ["whatsapp_number", "facebook_url", "instagram_url", "twitter_url", "youtube_url"],
    labels: { whatsapp_number: "WhatsApp Number", facebook_url: "Facebook URL", instagram_url: "Instagram URL", twitter_url: "Twitter URL", youtube_url: "YouTube URL" },
  },
  {
    title: "Order Settings",
    keys: ["order_prefix", "low_stock_alert_threshold"],
    labels: { order_prefix: "Order Number Prefix", low_stock_alert_threshold: "Low Stock Alert Threshold" },
  },
];

const TOGGLE_KEYS = ["maintenance_mode", "allow_guest_checkout"];
const TOGGLE_LABELS = { maintenance_mode: "Maintenance Mode", allow_guest_checkout: "Allow Guest Checkout" };

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [subscribers, setSubscribers] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  const loadSettings = () => {
    setLoading(true);
    settingsApi.get()
      .then((d) => setSettings(d.settings))
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSettings(); }, []);

  const loadSubscribers = () => {
    setSubLoading(true);
    settingsApi.newsletters()
      .then((d) => setSubscribers(d.subscribers))
      .catch(() => {})
      .finally(() => setSubLoading(false));
  };

  useEffect(() => {
    if (activeTab === "newsletters") loadSubscribers();
  }, [activeTab]);

  const handleChange = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update(settings);
      toast.success("Settings saved!");
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
          <p className="font-body text-muted-foreground">Configure your store settings</p>
        </div>
        <button onClick={loadSettings} className="btn-outline flex items-center gap-2 py-2 text-sm">
          <RefreshCw size={15} />Reload
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {["settings", "newsletters"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 font-body text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "newsletters" ? "Newsletter Subscribers" : "Store Settings"}
          </button>
        ))}
      </div>

      {activeTab === "settings" && (
        <form onSubmit={handleSave} className="space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.title} className="card p-6 space-y-5">
              <h2 className="font-heading text-lg font-bold text-foreground border-b border-border pb-3">{section.title}</h2>
              <div className="grid md:grid-cols-2 gap-5">
                {section.keys.map((key) => (
                  <div key={key}>
                    <label className="label">{section.labels[key]}</label>
                    <input
                      value={settings[key] || ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="input-field"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Toggles */}
          <div className="card p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-foreground border-b border-border pb-3">Feature Flags</h2>
            {TOGGLE_KEYS.map((key) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="font-body text-sm font-medium text-foreground">{TOGGLE_LABELS[key]}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={settings[key] === "true"}
                    onChange={(e) => handleChange(key, String(e.target.checked))}
                  />
                  <div
                    onClick={() => handleChange(key, settings[key] === "true" ? "false" : "true")}
                    className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${settings[key] === "true" ? "bg-accent" : "bg-gray-300"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${settings[key] === "true" ? "translate-x-5 ml-0.5" : "translate-x-0.5 ml-0.5"}`} />
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={16} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "newsletters" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Users size={18} className="text-accent" />
            <p className="font-body font-semibold text-foreground">{subscribers.length} active subscribers</p>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Email</th><th>Subscribed On</th></tr>
              </thead>
              <tbody>
                {subLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={2}><div className="h-8 bg-secondary animate-pulse rounded" /></td></tr>
                  ))
                ) : subscribers.length === 0 ? (
                  <tr><td colSpan={2} className="text-center py-8 text-muted-foreground">No subscribers yet</td></tr>
                ) : subscribers.map((s) => (
                  <tr key={s.id}>
                    <td className="font-body">{s.email}</td>
                    <td className="text-muted-foreground text-sm">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

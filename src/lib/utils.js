export function formatPrice(amount, symbol = "₹") {
  if (amount == null) return "";
  return `${symbol}${Number(amount).toLocaleString("en-IN")}`;
}

export function formatDate(ts) {
  if (!ts) return "";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(ts) {
  if (!ts) return "";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function truncate(str, maxLen = 100) {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

export function calcDiscount(price, discountPrice) {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

export function getApiOrigin() {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
  if (apiBaseUrl === "/api") return "";
  return apiBaseUrl.replace(/\/api$/, "");
}

export function resolveAssetUrl(url) {
  if (!url) return url;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("/uploads")) return `${getApiOrigin()}${url}`;
  return url;
}

export function getStatusColor(status) {
  const map = {
    pending: "badge-warning",
    confirmed: "badge-info",
    processing: "badge-info",
    shipped: "badge-info",
    delivered: "badge-success",
    cancelled: "badge-danger",
    refunded: "badge-gray",
    paid: "badge-success",
    failed: "badge-danger",
    active: "badge-success",
    inactive: "badge-gray",
  };
  return map[status?.toLowerCase()] || "badge-gray";
}

export function getStatusLabel(status) {
  if (!status) return "";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const ROLES = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  inventory_staff: "Inventory Staff",
  support_staff: "Support Staff",
};

export const ROLE_COLORS = {
  super_admin: "badge-danger",
  admin: "badge-info",
  manager: "badge-warning",
  inventory_staff: "badge-success",
  support_staff: "badge-gray",
};

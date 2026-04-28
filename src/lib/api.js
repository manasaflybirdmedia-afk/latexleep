const BASE_URL = "/api";

function getToken(type = "user") {
  return localStorage.getItem(type === "admin" ? "admin_token" : "user_token");
}

async function request(path, options = {}, tokenType = "user") {
  const token = getToken(tokenType);
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
  return data;
}

function adminRequest(path, options = {}) {
  return request(path, options, "admin");
}

// Auth
export const auth = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),
  updateProfile: (body) => request("/auth/profile", { method: "PUT", body: JSON.stringify(body) }),
  changePassword: (body) => request("/auth/change-password", { method: "PUT", body: JSON.stringify(body) }),
  adminLogin: (body) => request("/auth/admin/login", { method: "POST", body: JSON.stringify(body) }),
  adminMe: () => adminRequest("/auth/admin/me"),
  adminChangePassword: (body) => adminRequest("/auth/admin/change-password", { method: "PUT", body: JSON.stringify(body) }),
};

// Products
export const products = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/products${q ? `?${q}` : ""}`);
  },
  featured: () => request("/products/featured"),
  bestSellers: () => request("/products/best-sellers"),
  newArrivals: () => request("/products/new-arrivals"),
  get: (slug) => request(`/products/${slug}`),
  adminList: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return adminRequest(`/products/admin/list${q ? `?${q}` : ""}`);
  },
  create: (formData) => {
    const token = getToken("admin");
    return fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      return d;
    });
  },
  update: (id, formData) => {
    const token = getToken("admin");
    return fetch(`${BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      return d;
    });
  },
  delete: (id) => adminRequest(`/products/${id}`, { method: "DELETE" }),
  toggleFeatured: (id) => adminRequest(`/products/${id}/toggle-featured`, { method: "PUT" }),
};

// Categories
export const categories = {
  list: () => request("/categories"),
  get: (slug) => request(`/categories/${slug}`),
  adminList: () => adminRequest("/categories/admin/all"),
  create: (formData) => {
    const token = getToken("admin");
    return fetch(`${BASE_URL}/categories`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
    }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
  },
  update: (id, formData) => {
    const token = getToken("admin");
    return fetch(`${BASE_URL}/categories/${id}`, {
      method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formData,
    }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
  },
  delete: (id) => adminRequest(`/categories/${id}`, { method: "DELETE" }),
};

// Orders
export const orders = {
  place: (body) => request("/orders", { method: "POST", body: JSON.stringify(body) }),
  myOrders: () => request("/orders/my"),
  myOrder: (id) => request(`/orders/my/${id}`),
  adminAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return adminRequest(`/orders/admin/all${q ? `?${q}` : ""}`);
  },
  adminGet: (id) => adminRequest(`/orders/admin/${id}`),
  adminUpdateStatus: (id, body) => adminRequest(`/orders/admin/${id}/status`, { method: "PUT", body: JSON.stringify(body) }),
  adminStats: () => adminRequest("/orders/admin/stats/summary"),
};

// Coupons
export const coupons = {
  validate: (body) => request("/coupons/validate", { method: "POST", body: JSON.stringify(body) }),
  adminList: () => adminRequest("/coupons"),
  create: (body) => adminRequest("/coupons", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => adminRequest(`/coupons/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id) => adminRequest(`/coupons/${id}`, { method: "DELETE" }),
};

// Customers / User features
export const customers = {
  getAddresses: () => request("/customers/addresses"),
  addAddress: (body) => request("/customers/addresses", { method: "POST", body: JSON.stringify(body) }),
  updateAddress: (id, body) => request(`/customers/addresses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteAddress: (id) => request(`/customers/addresses/${id}`, { method: "DELETE" }),
  getWishlist: () => request("/customers/wishlist"),
  addToWishlist: (productId) => request(`/customers/wishlist/${productId}`, { method: "POST" }),
  removeFromWishlist: (productId) => request(`/customers/wishlist/${productId}`, { method: "DELETE" }),
  adminAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return adminRequest(`/customers/admin/all${q ? `?${q}` : ""}`);
  },
  adminGet: (id) => adminRequest(`/customers/admin/${id}`),
};

// Reviews
export const reviews = {
  submit: (productId, body) => request(`/reviews/${productId}`, { method: "POST", body: JSON.stringify(body) }),
  adminAll: () => adminRequest("/reviews/admin/all"),
  adminApprove: (id) => adminRequest(`/reviews/admin/${id}/approve`, { method: "PUT" }),
  adminDelete: (id) => adminRequest(`/reviews/admin/${id}`, { method: "DELETE" }),
};

// Inventory
export const inventory = {
  list: () => adminRequest("/inventory"),
  lowStock: () => adminRequest("/inventory/low-stock"),
  adjust: (productId, body) => adminRequest(`/inventory/${productId}/adjust`, { method: "POST", body: JSON.stringify(body) }),
  logs: (productId) => adminRequest(`/inventory/${productId}/logs`),
};

// Team
export const team = {
  list: () => adminRequest("/team"),
  create: (body) => adminRequest("/team", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => adminRequest(`/team/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id) => adminRequest(`/team/${id}`, { method: "DELETE" }),
};

// Payments
export const payments = {
  createIntent: (body) => request("/payments/create-intent", { method: "POST", body: JSON.stringify(body) }),
  confirm: (body) => request("/payments/confirm", { method: "POST", body: JSON.stringify(body) }),
  codConfirm: (body) => request("/payments/cod-confirm", { method: "POST", body: JSON.stringify(body) }),
};

// Settings
export const settings = {
  get: () => adminRequest("/settings"),
  update: (body) => adminRequest("/settings", { method: "PUT", body: JSON.stringify(body) }),
  public: () => request("/settings/public"),
  newsletter: (body) => request("/settings/newsletter", { method: "POST", body: JSON.stringify(body) }),
  newsletters: () => adminRequest("/settings/newsletters"),
};

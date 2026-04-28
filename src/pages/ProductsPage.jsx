import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Grid3X3, List, Search, X, ChevronDown } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import { products as productsApi, categories as categoriesApi } from "../lib/api.js";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popularity", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [productList, setProductList] = useState([]);
  const [cats, setCats] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [filterOpen, setFilterOpen] = useState(false);

  const filters = {
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    sort: searchParams.get("sort") || "newest",
    page: searchParams.get("page") || "1",
    featured: searchParams.get("featured") || "",
    rating: searchParams.get("rating") || "",
  };

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) { next.set(key, value); next.set("page", "1"); }
    else next.delete(key);
    setSearchParams(next);
  };

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    productsApi.list(params)
      .then((d) => { setProductList(d.products); setPagination(d.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams.toString()]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { categoriesApi.list().then((d) => setCats(d.categories)).catch(() => {}); }, []);

  const clearFilters = () => setSearchParams({});

  const hasFilters = filters.search || filters.category || filters.min_price || filters.max_price || filters.rating;

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <div className="bg-secondary border-b border-border py-10">
        <div className="container mx-auto px-6">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
            {filters.category ? cats.find((c) => c.slug === filters.category)?.name || "Products" : filters.featured ? "Featured Products" : "All Products"}
          </h1>
          <p className="font-body text-muted-foreground">{pagination.total} products found</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)} className="btn-outline flex items-center gap-2 shrink-0">
            <SlidersHorizontal size={16} />Filters
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`${filterOpen ? "block" : "hidden"} lg:block w-64 shrink-0`}>
            <div className="card p-5 space-y-6 sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-foreground">Filters</h3>
                {hasFilters && <button onClick={clearFilters} className="text-xs text-destructive hover:underline flex items-center gap-1"><X size={12} />Clear all</button>}
              </div>

              {/* Category */}
              <div>
                <h4 className="font-body font-semibold text-sm mb-3">Category</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="cat" checked={!filters.category} onChange={() => setFilter("category", "")} className="accent-accent" />
                    <span className="font-body text-sm">All</span>
                  </label>
                  {cats.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="cat" checked={filters.category === c.slug} onChange={() => setFilter("category", c.slug)} className="accent-accent" />
                      <span className="font-body text-sm">{c.name} ({c.product_count})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="font-body font-semibold text-sm mb-3">Price Range</h4>
                <div className="flex gap-2 items-center">
                  <input type="number" placeholder="Min" value={filters.min_price} onChange={(e) => setFilter("min_price", e.target.value)} className="input-field text-sm py-2 px-3" />
                  <span className="text-muted-foreground">—</span>
                  <input type="number" placeholder="Max" value={filters.max_price} onChange={(e) => setFilter("max_price", e.target.value)} className="input-field text-sm py-2 px-3" />
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="font-body font-semibold text-sm mb-3">Minimum Rating</h4>
                {[4, 3, 2].map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="radio" name="rating" checked={filters.rating === String(r)} onChange={() => setFilter("rating", String(r))} className="accent-accent" />
                    <span className="font-body text-sm">{r}+ Stars</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <span className="font-body text-sm text-muted-foreground">{pagination.total} results</span>
              <div className="flex items-center gap-3">
                <select value={filters.sort} onChange={(e) => setFilter("sort", e.target.value)} className="input-field py-2 text-sm w-auto pr-8">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="hidden md:flex border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}><Grid3X3 size={16} /></button>
                  <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}><List size={16} /></button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className={`grid ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6`}>
                {[...Array(6)].map((_, i) => <div key={i} className="rounded-2xl bg-secondary h-80 animate-pulse" />)}
              </div>
            ) : productList.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-heading text-2xl font-semibold text-foreground mb-2">No products found</p>
                <p className="font-body text-muted-foreground mb-6">Try adjusting your filters</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <div className={`grid ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6`}>
                {productList.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {[...Array(pagination.pages)].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => setFilter("page", String(p))} className={`w-10 h-10 rounded-lg font-body font-semibold text-sm transition-all ${p === parseInt(filters.page) ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

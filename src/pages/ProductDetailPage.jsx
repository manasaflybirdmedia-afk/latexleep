import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, ShoppingCart, Heart, Share2, Zap, Star, ChevronLeft, ChevronRight, Package, Shield, Truck } from "lucide-react";
import { products as productsApi, reviews as reviewsApi } from "../lib/api.js";
import { useCart } from "../contexts/CartContext.jsx";
import { useWishlist } from "../contexts/WishlistContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { formatPrice, calcDiscount, formatDate } from "../lib/utils.js";
import StarRating from "../components/StarRating.jsx";
import ProductCard from "../components/ProductCard.jsx";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addToCart } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    productsApi.get(slug)
      .then((d) => { setProduct(d.product); setRelated(d.related); setImgIdx(0); })
      .catch(() => {})
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
      <p className="font-heading text-2xl font-bold">Product not found</p>
      <Link to="/products" className="btn-primary">Back to Products</Link>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : [{ url: "/assets/hero-bedroom.jpg", alt: product.name }];
  const discountPct = calcDiscount(product.price, product.discount_price);
  const displayPrice = product.discount_price || product.price;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, qty);
    toast.success(`${product.name} added to cart!`);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error("Please login to submit a review"); return; }
    setSubmittingReview(true);
    try {
      await reviewsApi.submit(product.id, reviewForm);
      toast.success("Review submitted!");
      setReviewForm({ rating: 5, title: "", body: "" });
      const d = await productsApi.get(slug);
      setProduct(d.product);
    } catch (err) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Breadcrumb */}
      <div className="bg-secondary border-b border-border py-3">
        <div className="container mx-auto px-6">
          <nav className="font-body text-sm text-muted-foreground flex items-center gap-2">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
            {product.category_name && <><span>/</span><Link to={`/products?category=${product.category_slug}`} className="hover:text-foreground transition-colors">{product.category_name}</Link></>}
            <span>/</span>
            <span className="text-foreground truncate max-w-48">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="relative rounded-2xl overflow-hidden aspect-square bg-secondary mb-4">
              {product.is_featured === 1 && (
                <div className="absolute top-4 left-4 z-10 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <Zap size={14} />Featured
                </div>
              )}
              {discountPct > 0 && (
                <div className="absolute top-4 right-4 z-10 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-bold">-{discountPct}%</div>
              )}
              <img
                src={images[imgIdx]?.url || "/assets/hero-bedroom.jpg"}
                alt={images[imgIdx]?.alt || product.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "/assets/hero-bedroom.jpg"; }}
              />
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white shadow-md">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setImgIdx((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white shadow-md">
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? "border-accent" : "border-border hover:border-accent/50"}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = "/assets/hero-bedroom.jpg"; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="mb-1">
              <span className="font-body text-sm text-accent font-semibold">{product.category_name}</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">{product.name}</h1>

            {product.rating_avg > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <StarRating value={Math.round(product.rating_avg)} readOnly size={18} />
                <span className="font-body text-sm text-muted-foreground">{product.rating_avg.toFixed(1)} ({product.rating_count} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-heading text-4xl font-bold text-foreground">{formatPrice(displayPrice)}</span>
              {discountPct > 0 && (
                <>
                  <span className="text-xl text-muted-foreground line-through">{formatPrice(product.price)}</span>
                  <span className="bg-green-100 text-green-700 text-sm font-bold px-2 py-0.5 rounded-full">Save {formatPrice(product.price - displayPrice)}</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="mb-6">
              {product.stock > 10 ? (
                <span className="badge badge-success">In Stock</span>
              ) : product.stock > 0 ? (
                <span className="badge badge-warning">Only {product.stock} left</span>
              ) : (
                <span className="badge badge-danger">Out of Stock</span>
              )}
              {product.sku && <span className="ml-3 font-body text-xs text-muted-foreground">SKU: {product.sku}</span>}
            </div>

            <p className="font-body text-muted-foreground leading-relaxed mb-6">{product.description}</p>

            {/* Features */}
            {product.features?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-body font-semibold text-foreground mb-3">Key Features</h3>
                <ul className="space-y-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 font-body text-sm text-foreground">
                      <Check size={16} className="text-accent shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Qty + Actions */}
            {product.stock > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-secondary font-bold text-lg">−</button>
                  <span className="w-12 text-center font-body font-semibold">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-secondary font-bold text-lg">+</button>
                </div>
                <button onClick={handleAddToCart} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <ShoppingCart size={18} />Add to Cart
                </button>
                <button onClick={() => toggle(product.id)} className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${inWishlist ? "border-red-400 bg-red-50 text-red-500" : "border-border hover:border-accent hover:text-accent"}`}>
                  <Heart size={18} fill={inWishlist ? "currentColor" : "none"} />
                </button>
              </div>
            )}

            {/* Buy Now */}
            {product.stock > 0 && (
              <Link to="/checkout" onClick={() => addToCart(product, qty)} className="w-full btn-accent flex items-center justify-center gap-2 mb-6">
                Buy Now
              </Link>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border">
              {[
                { icon: Shield, label: "Genuine Product" },
                { icon: Truck, label: "Free Delivery >₹5K" },
                { icon: Package, label: "Easy Returns" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <Icon size={18} className="text-accent" />
                  <span className="font-body text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Customer Reviews</h2>
            {product.reviews?.length === 0 ? (
              <p className="text-muted-foreground font-body">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-6">
                {product.reviews?.map((r) => (
                  <div key={r.id} className="card p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-body font-semibold text-foreground">{r.user_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                      </div>
                      <StarRating value={r.rating} readOnly size={14} />
                    </div>
                    {r.title && <p className="font-body font-semibold text-foreground mb-1">{r.title}</p>}
                    <p className="font-body text-sm text-muted-foreground">{r.body}</p>
                    {r.is_verified === 1 && <span className="mt-2 inline-block badge badge-success text-xs">Verified Purchase</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Write review */}
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground mb-4">Write a Review</h3>
            {!user ? (
              <div className="card p-5 text-center">
                <p className="font-body text-muted-foreground mb-4">Please login to write a review</p>
                <Link to="/login" className="btn-primary text-sm">Login</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="card p-5 space-y-4">
                <div>
                  <label className="label">Your Rating</label>
                  <StarRating value={reviewForm.rating} onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))} size={24} />
                </div>
                <div>
                  <label className="label">Review Title</label>
                  <input type="text" value={reviewForm.title} onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))} placeholder="Summarize your experience" className="input-field" />
                </div>
                <div>
                  <label className="label">Your Review</label>
                  <textarea value={reviewForm.body} onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))} placeholder="Tell others about your experience..." rows={4} className="input-field resize-none" />
                </div>
                <button type="submit" disabled={submittingReview} className="btn-primary w-full">{submittingReview ? "Submitting..." : "Submit Review"}</button>
              </form>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8">You May Also Like</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

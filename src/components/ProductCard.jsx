import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, Check, Zap } from "lucide-react";
import { useCart } from "../contexts/CartContext.jsx";
import { useWishlist } from "../contexts/WishlistContext.jsx";
import { formatPrice, calcDiscount } from "../lib/utils.js";
import toast from "react-hot-toast";

export default function ProductCard({ product, showFeatures = false }) {
  const { addToCart } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const discountPct = calcDiscount(product.price, product.discount_price);
  const displayPrice = product.discount_price || product.price;
  const image = product.primary_image || product.images?.[0]?.url || "/assets/hero-bedroom.jpg";

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  };

  return (
    <div className="group rounded-2xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="aspect-square overflow-hidden relative">
        {/* Category badge */}
        <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-foreground">
          {product.category_name}
        </div>

        {/* Featured badge */}
        {product.is_featured === 1 && (
          <div className="absolute top-3 right-10 z-10 bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Zap size={10} />Featured
          </div>
        )}

        {/* Discount badge */}
        {discountPct > 0 && (
          <div className="absolute top-3 right-3 z-10 bg-destructive text-destructive-foreground px-2.5 py-1 rounded-full text-xs font-bold">
            -{discountPct}%
          </div>
        )}

        {/* Wishlist button */}
        <button onClick={handleWishlist} className={`absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all ${inWishlist ? "bg-red-500 text-white" : "bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500"}`}>
          <Heart size={16} fill={inWishlist ? "currentColor" : "none"} />
        </button>

        <Link to={`/products/${product.slug}`}>
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { e.target.src = "/assets/hero-bedroom.jpg"; }}
          />
        </Link>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-heading text-xl font-semibold text-card-foreground mb-2 hover:text-accent transition-colors line-clamp-2">{product.name}</h3>
        </Link>

        {product.rating_avg > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={13} className={s <= Math.round(product.rating_avg) ? "text-accent fill-accent" : "text-gray-300 fill-gray-300"} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({product.rating_count})</span>
          </div>
        )}

        <p className="font-body text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">{product.short_description || product.description}</p>

        {showFeatures && product.features && (
          <ul className="space-y-2 mb-4 flex-1">
            {(Array.isArray(product.features) ? product.features : []).slice(0, 3).map((f) => (
              <li key={f} className="text-xs text-foreground flex items-start gap-2">
                <Check size={13} className="text-accent shrink-0 mt-0.5" /><span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-heading text-2xl font-bold text-foreground">{formatPrice(displayPrice)}</span>
            {discountPct > 0 && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>}
          </div>

          {product.stock === 0 ? (
            <div className="w-full rounded-xl bg-muted py-3 text-center text-sm text-muted-foreground font-medium">Out of Stock</div>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleAddToCart} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-md">
                <ShoppingCart size={15} />Add to Cart
              </button>
              <Link to={`/products/${product.slug}`} className="px-4 rounded-xl border-2 border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center">
                View
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

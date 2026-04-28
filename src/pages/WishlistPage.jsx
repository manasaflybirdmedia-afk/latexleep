import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { customers as customersApi } from "../lib/api.js";
import { useCart } from "../contexts/CartContext.jsx";
import { useWishlist } from "../contexts/WishlistContext.jsx";
import { formatPrice, resolveAssetUrl } from "../lib/utils.js";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const { user } = useAuth();
  const { toggle } = useWishlist();
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      customersApi.getWishlist()
        .then((d) => setItems(d.items))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRemove = (productId) => {
    toggle(productId);
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="bg-secondary border-b border-border py-10">
        <div className="container mx-auto px-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">My Wishlist</h1>
          <p className="font-body text-muted-foreground">{items.length} saved items</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        {!user ? (
          <div className="text-center py-20">
            <Heart size={48} className="text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-2">Please login</h2>
            <p className="font-body text-muted-foreground mb-6">Sign in to view your wishlist</p>
            <Link to="/login" className="btn-primary">Login</Link>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} className="text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="font-body text-muted-foreground mb-6">Save items you love for later</p>
            <Link to="/products" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.id} className="card overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="aspect-square relative overflow-hidden">
                  <button onClick={() => handleRemove(item.product_id)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                    <Heart size={14} fill="currentColor" />
                  </button>
                  <Link to={`/products/${item.slug}`}>
                    <img src={resolveAssetUrl(item.primary_image || "/assets/hero-bedroom.jpg")} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = "/assets/hero-bedroom.jpg"; }} />
                  </Link>
                </div>
                <div className="p-4">
                  <Link to={`/products/${item.slug}`}><h3 className="font-heading font-semibold text-foreground hover:text-accent transition-colors line-clamp-2 mb-2">{item.name}</h3></Link>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-heading text-xl font-bold">{formatPrice(item.discount_price || item.price)}</span>
                    {item.stock === 0 && <span className="badge badge-danger">Out of stock</span>}
                  </div>
                  <button onClick={() => { addToCart(item); toast.success("Added to cart!"); }} disabled={item.stock === 0} className="btn-primary w-full text-sm py-2.5">Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

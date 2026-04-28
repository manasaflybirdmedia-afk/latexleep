import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, Tag, X } from "lucide-react";
import { useCart } from "../contexts/CartContext.jsx";
import { formatPrice } from "../lib/utils.js";
import { coupons as couponsApi } from "../lib/api.js";
import toast from "react-hot-toast";

export default function CartPage() {
  const { items, subtotal, shippingCharge, tax, total, coupon, couponDiscount, updateQuantity, removeFromCart, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplying(true);
    try {
      const { coupon: c, discount } = (await couponsApi.validate({ code: couponCode.trim(), order_amount: subtotal })).coupon
        ? await couponsApi.validate({ code: couponCode.trim(), order_amount: subtotal })
        : await couponsApi.validate({ code: couponCode.trim(), order_amount: subtotal });
      applyCoupon(c || { code: couponCode.trim() }, discount || 0);
      toast.success(`Coupon applied! You saved ${formatPrice(discount)}`);
    } catch (err) {
      toast.error(err.message || "Invalid coupon code");
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-24 flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
          <ShoppingBag size={40} className="text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="font-body text-muted-foreground">Add some products to get started</p>
        </div>
        <Link to="/products" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="bg-secondary border-b border-border py-10">
        <div className="container mx-auto px-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">Shopping Cart</h1>
          <p className="font-body text-muted-foreground">{items.length} item{items.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = item.discount_price || item.price;
              return (
                <div key={item.id} className="card p-4 flex gap-4">
                  <Link to={`/products/${item.slug}`} className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-secondary">
                    <img src={item.primary_image || "/assets/hero-bedroom.jpg"} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = "/assets/hero-bedroom.jpg"; }} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/products/${item.slug}`} className="font-heading font-semibold text-foreground hover:text-accent transition-colors line-clamp-2">{item.name}</Link>
                        {item.category_name && <p className="font-body text-xs text-muted-foreground mt-0.5">{item.category_name}</p>}
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-secondary"><Minus size={14} /></button>
                        <span className="w-10 text-center font-body font-semibold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-secondary"><Plus size={14} /></button>
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-bold text-foreground">{formatPrice(price * item.quantity)}</p>
                        {item.quantity > 1 && <p className="font-body text-xs text-muted-foreground">{formatPrice(price)} each</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div>
            {/* Coupon */}
            <div className="card p-5 mb-4">
              <h3 className="font-body font-semibold text-foreground mb-3 flex items-center gap-2"><Tag size={16} />Apply Coupon</h3>
              {coupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-body font-semibold text-green-700 text-sm">{coupon.code}</p>
                    <p className="font-body text-xs text-green-600">Saved {formatPrice(couponDiscount)}</p>
                  </div>
                  <button onClick={removeCoupon} className="text-green-600 hover:text-red-500"><X size={16} /></button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="input-field flex-1 text-sm py-2" />
                  <button type="submit" disabled={applying} className="btn-outline text-sm py-2 px-4 shrink-0">{applying ? "..." : "Apply"}</button>
                </form>
              )}
              <p className="font-body text-xs text-muted-foreground mt-2">Try <span className="font-semibold text-accent">WELCOME10</span> for 10% off your first order!</p>
            </div>

            {/* Price breakdown */}
            <div className="card p-5">
              <h3 className="font-body font-semibold text-foreground mb-4">Order Summary</h3>
              <div className="space-y-3 font-body text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>− {formatPrice(couponDiscount)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shippingCharge === 0 ? <span className="text-green-600">Free</span> : formatPrice(shippingCharge)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax (18% GST)</span><span>{formatPrice(tax)}</span></div>
                <div className="border-t border-border pt-3 flex justify-between font-semibold text-base">
                  <span>Total</span><span className="font-heading text-xl font-bold">{formatPrice(total)}</span>
                </div>
              </div>
              {shippingCharge > 0 && (
                <p className="font-body text-xs text-muted-foreground mt-3">Add {formatPrice(5000 - subtotal)} more for free shipping!</p>
              )}
              <Link to="/checkout" className="btn-accent w-full mt-5 flex items-center justify-center gap-2">
                Proceed to Checkout
              </Link>
              <Link to="/products" className="btn-ghost w-full mt-2 text-sm flex items-center justify-center">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

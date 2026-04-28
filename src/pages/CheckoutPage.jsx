import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, CreditCard, Smartphone, Banknote, Check } from "lucide-react";
import { useCart } from "../contexts/CartContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { orders as ordersApi, customers as customersApi } from "../lib/api.js";
import { formatPrice, resolveAssetUrl } from "../lib/utils.js";
import toast from "react-hot-toast";

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay when you receive" },
  { id: "stripe", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, etc." },
  { id: "upi", label: "UPI", icon: Smartphone, desc: "GPay, PhonePe, Paytm" },
];

const STATES = ["Andhra Pradesh","Telangana","Karnataka","Tamil Nadu","Kerala","Maharashtra","Gujarat","Rajasthan","Delhi","Uttar Pradesh","Bihar","West Bengal","Odisha","Madhya Pradesh","Punjab","Haryana","Other"];

export default function CheckoutPage() {
  const { items, subtotal, shippingCharge, tax, total, coupon, couponDiscount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [address, setAddress] = useState({ name: user?.name || "", phone: "", line1: "", line2: "", city: "", state: "Andhra Pradesh", pincode: "", country: "India" });

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (items.length === 0) { navigate("/cart"); return; }
    customersApi.getAddresses().then((d) => { setSavedAddresses(d.addresses); if (d.addresses.length > 0) { const def = d.addresses.find((a) => a.is_default) || d.addresses[0]; setSelectedAddr(def.id); setAddress({ name: def.name, phone: def.phone, line1: def.line1, line2: def.line2 || "", city: def.city, state: def.state, pincode: def.pincode, country: def.country || "India" }); } }).catch(() => {});
  }, [user, items]);

  const handleAddressChange = (e) => setAddress((a) => ({ ...a, [e.target.name]: e.target.value }));

  const handlePlaceOrder = async () => {
    if (!address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
      toast.error("Please fill all address fields"); return;
    }
    setLoading(true);
    try {
      const { order } = await ordersApi.place({
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        shipping_address: address,
        payment_method: paymentMethod,
        coupon_code: coupon?.code || null,
      });

      if (paymentMethod === "cod") {
        clearCart();
        navigate(`/dashboard/orders/${order.id}`, { state: { success: true } });
        toast.success("Order placed successfully!");
      } else {
        // For card/UPI — in production integrate Stripe here
        clearCart();
        navigate(`/dashboard/orders/${order.id}`, { state: { success: true } });
        toast.success("Order placed! Complete payment to confirm.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="bg-secondary border-b border-border py-6">
        <div className="container mx-auto px-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">Checkout</h1>
          <div className="flex items-center gap-3 mt-3">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 font-body text-sm font-medium ${step >= s ? "text-accent" : "text-muted-foreground"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > s ? "bg-accent text-accent-foreground" : step === s ? "bg-accent text-accent-foreground" : "bg-secondary border border-border"}`}>
                    {step > s ? <Check size={14} /> : s}
                  </div>
                  <span className="hidden sm:inline">{["Address", "Payment", "Review"][s - 1]}</span>
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-accent" : "bg-border"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* STEP 1: Address */}
            {step === 1 && (
              <div className="card p-6">
                <h2 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2"><MapPin size={20} />Shipping Address</h2>

                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-body font-semibold text-sm mb-3">Saved Addresses</h3>
                    <div className="space-y-3">
                      {savedAddresses.map((a) => (
                        <label key={a.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddr === a.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}>
                          <input type="radio" name="addr" checked={selectedAddr === a.id} onChange={() => { setSelectedAddr(a.id); setAddress({ name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 || "", city: a.city, state: a.state, pincode: a.pincode, country: a.country }); }} className="mt-1 accent-accent" />
                          <div className="font-body text-sm">
                            <p className="font-semibold">{a.name}</p>
                            <p className="text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} - {a.pincode}</p>
                            <p className="text-muted-foreground">{a.phone}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <button onClick={() => setSelectedAddr(null)} className="mt-3 font-body text-sm text-accent hover:underline">+ Use a new address</button>
                  </div>
                )}

                {(selectedAddr === null || savedAddresses.length === 0) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="label">Full Name *</label><input name="name" value={address.name} onChange={handleAddressChange} className="input-field" placeholder="Your name" /></div>
                    <div><label className="label">Phone *</label><input name="phone" value={address.phone} onChange={handleAddressChange} className="input-field" placeholder="10-digit mobile number" /></div>
                    <div className="md:col-span-2"><label className="label">Address Line 1 *</label><input name="line1" value={address.line1} onChange={handleAddressChange} className="input-field" placeholder="House no., Street" /></div>
                    <div className="md:col-span-2"><label className="label">Address Line 2</label><input name="line2" value={address.line2} onChange={handleAddressChange} className="input-field" placeholder="Area, Landmark (optional)" /></div>
                    <div><label className="label">City *</label><input name="city" value={address.city} onChange={handleAddressChange} className="input-field" placeholder="City" /></div>
                    <div><label className="label">State *</label>
                      <select name="state" value={address.state} onChange={handleAddressChange} className="input-field">
                        {STATES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div><label className="label">PIN Code *</label><input name="pincode" value={address.pincode} onChange={handleAddressChange} className="input-field" placeholder="6-digit PIN" /></div>
                  </div>
                )}

                <button onClick={() => setStep(2)} className="btn-primary mt-6">Continue to Payment</button>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div className="card p-6">
                <h2 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2"><CreditCard size={20} />Payment Method</h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}>
                      <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-accent" />
                      <m.icon size={20} className="text-primary" />
                      <div>
                        <p className="font-body font-semibold text-foreground text-sm">{m.label}</p>
                        <p className="font-body text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {paymentMethod !== "cod" && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="font-body text-sm text-amber-700">Online payment integration requires Stripe configuration. You can still proceed — order will be confirmed on payment completion.</p>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="btn-outline">Back</button>
                  <button onClick={() => setStep(3)} className="btn-primary">Review Order</button>
                </div>
              </div>
            )}

            {/* STEP 3: Review */}
            {step === 3 && (
              <div className="card p-6">
                <h2 className="font-heading text-xl font-bold text-foreground mb-6">Review Order</h2>
                <div className="mb-6">
                  <h3 className="font-body font-semibold text-sm text-foreground mb-2">Delivering to</h3>
                  <p className="font-body text-sm text-muted-foreground">{address.name}, {address.phone}</p>
                  <p className="font-body text-sm text-muted-foreground">{address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} - {address.pincode}</p>
                </div>
                <div className="mb-6">
                  <h3 className="font-body font-semibold text-sm text-foreground mb-3">Items ({items.length})</h3>
                  <div className="space-y-3">
                    {items.map((i) => (
                      <div key={i.id} className="flex items-center gap-3">
                        <img src={resolveAssetUrl(i.primary_image || "/assets/hero-bedroom.jpg")} alt="" className="w-12 h-12 rounded-lg object-cover" onError={(e) => { e.target.src = "/assets/hero-bedroom.jpg"; }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-medium text-foreground truncate">{i.name}</p>
                          <p className="font-body text-xs text-muted-foreground">Qty: {i.quantity}</p>
                        </div>
                        <p className="font-body font-semibold text-sm">{formatPrice((i.discount_price || i.price) * i.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="btn-outline">Back</button>
                  <button onClick={handlePlaceOrder} disabled={loading} className="btn-accent flex-1">
                    {loading ? "Placing Order..." : `Place Order — ${formatPrice(total)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div className="card p-5 h-fit sticky top-20">
            <h3 className="font-body font-semibold text-foreground mb-4">Price Summary</h3>
            <div className="space-y-3 font-body text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>− {formatPrice(couponDiscount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shippingCharge === 0 ? <span className="text-green-600">Free</span> : formatPrice(shippingCharge)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax (GST 18%)</span><span>{formatPrice(tax)}</span></div>
              <div className="border-t border-border pt-3 flex justify-between font-semibold text-base">
                <span>Total</span><span className="font-heading text-xl font-bold">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

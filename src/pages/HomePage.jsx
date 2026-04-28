import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Star, ArrowRight, MessageCircle, Shield, Truck, Award, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import { products as productsApi, categories as categoriesApi, settings as settingsApi } from "../lib/api.js";
import toast from "react-hot-toast";

const HERO_SLIDES = [
  {
    image: "/assets/hero-bedroom.jpg",
    badge: "Premium Mattress Manufacturers — Tirupathi",
    title: "Sleep in\nPure Comfort",
    accent: "Pure Comfort",
    desc: "Handcrafted latex, foam & cooling gel mattresses built for the perfect night's rest. Made in Tirupathi with love.",
  },
  {
    image: "/assets/cooling-gel-mattress.jpg",
    badge: "New Arrival",
    title: "Cool Sleep\nAll Night",
    accent: "All Night",
    desc: "Advanced cooling gel technology keeps you comfortable even on the hottest Indian nights.",
  },
  {
    image: "/assets/natural-latex-mattress.jpg",
    badge: "Best Seller",
    title: "Natural\nLuxury Sleep",
    accent: "Luxury Sleep",
    desc: "100% natural latex — eco-friendly, anti-microbial and built to last over 10 years.",
  },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", city: "Hyderabad", rating: 5, text: "The Natural Latex Mattress completely transformed my sleep. No more back pain after years of struggling!" },
  { name: "Ravi Kumar", city: "Tirupathi", rating: 5, text: "Excellent quality and outstanding service. The cooling gel mattress is perfect for our hot summers." },
  { name: "Anitha Reddy", city: "Chennai", rating: 5, text: "I was skeptical at first, but the memory foam pillow is absolutely worth every rupee. My neck pain is gone." },
  { name: "Mohammed Ali", city: "Bangalore", rating: 4, text: "Great product quality and fast delivery. The mattress cleaning service is also top-notch. Highly recommended!" },
];

const TRUST_BADGES = [
  { icon: Shield, label: "Safe & Secure", desc: "ISO certified materials" },
  { icon: Truck, label: "Free Delivery", desc: "On orders above ₹5000" },
  { icon: Award, label: "10 Year Warranty", desc: "On all mattresses" },
  { icon: RefreshCw, label: "Easy Returns", desc: "30-day trial period" },
];

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [cats, setCats] = useState([]);
  const [newsletter, setNewsletter] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    productsApi.featured().then((d) => setFeatured(d.products)).catch(() => {});
    productsApi.bestSellers().then((d) => setBestSellers(d.products)).catch(() => {});
    productsApi.newArrivals().then((d) => setNewArrivals(d.products)).catch(() => {});
    categoriesApi.list().then((d) => setCats(d.categories)).catch(() => {});
  }, []);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletter) return;
    setSubscribing(true);
    try {
      await settingsApi.newsletter({ email: newsletter });
      toast.success("Subscribed successfully!");
      setNewsletter("");
    } catch (err) {
      toast.error(err.message || "Already subscribed!");
    } finally {
      setSubscribing(false);
    }
  };

  const current = HERO_SLIDES[slide];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── HERO SLIDER ─────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 transition-all duration-700">
          <img src={current.image} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-white/80 font-body text-sm tracking-[0.3em] uppercase mb-4 font-semibold">{current.badge}</p>
            <h1 className="font-heading text-5xl md:text-7xl font-bold text-white leading-tight mb-6 whitespace-pre-line">
              {current.title.split(current.accent).map((part, i, arr) => (
                <React.Fragment key={i}>{part}{i < arr.length - 1 && <span className="text-accent">{current.accent}</span>}</React.Fragment>
              ))}
            </h1>
            <p className="text-white/90 font-body text-lg md:text-xl leading-relaxed mb-10 max-w-lg">{current.desc}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products" className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 font-body font-semibold text-accent-foreground text-lg transition-all hover:bg-accent/90 hover:scale-105">
                Explore Collection <ArrowRight size={20} />
              </Link>
              <a href="https://wa.me/918374530026?text=Hi%20LATEX%20Leep!%20I'm%20interested%20in%20your%20mattresses." target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/30 bg-black/20 backdrop-blur-sm px-8 py-4 font-body font-semibold text-white text-lg transition-all hover:bg-white/10">
                <MessageCircle size={20} />Chat with Us
              </a>
            </div>
          </div>
        </div>

        {/* Slide controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} className={`h-2 rounded-full transition-all ${i === slide ? "w-8 bg-accent" : "w-2 bg-white/50"}`} />
          ))}
        </div>
        <button onClick={() => setSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => setSlide((s) => (s + 1) % HERO_SLIDES.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors">
          <ChevronRight size={20} />
        </button>
      </section>

      {/* ─── TRUST BADGES ─────────────────────────────── */}
      <section className="bg-primary py-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 text-primary-foreground">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-accent" />
                </div>
                <div>
                  <p className="font-body font-semibold text-sm">{label}</p>
                  <p className="font-body text-xs text-primary-foreground/60">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="section-subtitle mb-3">Shop by Category</p>
            <h2 className="section-title">Explore Our Range</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {cats.slice(0, 4).map((cat) => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`} className="group relative rounded-2xl overflow-hidden aspect-square bg-secondary hover:shadow-xl transition-all hover:-translate-y-1">
                <img src={cat.image || "/assets/hero-bedroom.jpg"} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = "/assets/hero-bedroom.jpg"; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-heading text-xl font-bold text-white">{cat.name}</h3>
                  <p className="text-white/70 text-xs font-body">{cat.product_count} products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="section-subtitle mb-3">Handpicked Collection</p>
                <h2 className="section-title">Featured Products</h2>
              </div>
              <Link to="/products?featured=true" className="hidden md:flex items-center gap-2 font-body font-semibold text-accent hover:gap-3 transition-all">
                View all <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ─── PROMO BANNER ─────────────────────────────── */}
      <section className="py-20 bg-background overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="rounded-3xl bg-primary overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white -translate-x-1/2 translate-y-1/2" />
            </div>
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center p-10 md:p-16">
              <div>
                <span className="inline-block bg-accent/20 text-accent border border-accent/30 rounded-full px-4 py-1 text-sm font-semibold mb-4">Limited Offer</span>
                <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
                  Get 10% Off<br />Your First Order
                </h2>
                <p className="font-body text-primary-foreground/70 mb-6">Use coupon code <span className="font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">WELCOME10</span> at checkout. Valid on all orders above ₹1000.</p>
                <Link to="/products" className="btn-accent inline-flex items-center gap-2">
                  Shop Now <ArrowRight size={18} />
                </Link>
              </div>
              <div className="hidden md:block relative">
                <img src="/assets/natural-latex-mattress.jpg" alt="Offer" className="rounded-2xl shadow-2xl" />
                <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground rounded-full w-20 h-20 flex flex-col items-center justify-center text-center shadow-xl">
                  <span className="font-heading font-bold text-xl leading-none">10%</span>
                  <span className="text-xs font-semibold">OFF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BEST SELLERS ─────────────────────────────── */}
      {bestSellers.length > 0 && (
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="section-subtitle mb-3">Customer Favourites</p>
                <h2 className="section-title">Best Sellers</h2>
              </div>
              <Link to="/products?sort=popularity" className="hidden md:flex items-center gap-2 font-body font-semibold text-accent hover:gap-3 transition-all">
                View all <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ─── NEW ARRIVALS ─────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="section-subtitle mb-3">Just Landed</p>
                <h2 className="section-title">New Arrivals</h2>
              </div>
              <Link to="/products?sort=newest" className="hidden md:flex items-center gap-2 font-body font-semibold text-accent hover:gap-3 transition-all">
                View all <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ─── ABOUT ─────────────────────────────── */}
      <section id="about" className="py-24 bg-secondary">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-subtitle mb-3">About Us</p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">Crafting Perfect Sleep Since Inception</h2>
              <p className="font-body text-muted-foreground text-lg leading-relaxed mb-6">
                At LATEX Leep, we believe that a good night's sleep is the foundation of a healthy, happy life. Based in the heart of Tirupathi, we specialize in manufacturing premium quality mattresses that cater to your unique comfort needs.
              </p>
              <p className="font-body text-muted-foreground text-lg leading-relaxed mb-8">
                From natural latex to advanced cooling gel technologies, every mattress is handcrafted with precision, care, and the finest materials. Our mission is simple: to provide you with pure comfort that lasts.
              </p>
              <ul className="space-y-3">
                {["Eco-friendly manufacturing process","10+ years of sleep expertise","Serving 10,000+ happy customers","Made in Tirupathi with pride"].map((f) => (
                  <li key={f} className="flex items-center gap-3 font-body text-foreground">
                    <Check className="w-5 h-5 text-accent shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-video md:aspect-square">
              <img src="/assets/hero-bedroom.jpg" alt="About LATEX Leep" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="section-subtitle mb-3">What Customers Say</p>
            <h2 className="section-title">Real Reviews</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map((s) => <Star key={s} size={16} className={s <= t.rating ? "text-accent fill-accent" : "text-gray-300 fill-gray-300"} />)}
                </div>
                <p className="font-body text-muted-foreground text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-body font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ─────────────────────────────── */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <p className="section-subtitle text-accent mb-3">Stay in the loop</p>
          <h2 className="font-heading text-4xl font-bold text-primary-foreground mb-4">Get Exclusive Deals</h2>
          <p className="font-body text-primary-foreground/60 mb-8">Subscribe to receive offers, new arrivals and sleep tips delivered to your inbox.</p>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={newsletter}
              onChange={(e) => setNewsletter(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button type="submit" disabled={subscribing} className="btn-accent shrink-0">
              {subscribing ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

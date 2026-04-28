import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, MapPin, Mail, Send, Instagram, Facebook, Youtube } from "lucide-react";
import toast from "react-hot-toast";
import { settings } from "../lib/api.js";

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      await settings.newsletter({ email });
      toast.success("Successfully subscribed! Thank you.");
      setEmail("");
    } catch (err) {
      toast.error(err.message || "Subscription failed");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-[#1e293b] text-white">
      {/* Newsletter strip */}
      <div className="bg-accent/10 border-b border-white/10">
        <div className="container mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-heading text-2xl font-bold text-white mb-1">Stay Updated</h3>
              <p className="text-white/60 font-body text-sm">Subscribe for exclusive deals, sleep tips and new arrivals.</p>
            </div>
            <form onSubmit={handleNewsletter} className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 md:w-72 rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
              <button type="submit" disabled={subscribing} className="rounded-lg bg-accent px-5 py-3 text-accent-foreground font-semibold flex items-center gap-2 hover:bg-accent/90 transition-colors disabled:opacity-60">
                <Send size={16} />{subscribing ? "..." : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-3xl font-bold text-white mb-4">LATEX <span className="text-accent">Leep</span></h3>
            <p className="font-body text-sm text-white/60 leading-relaxed mb-6 max-w-xs">
              Premium mattress manufacturers based in Tirupathi. Quality sleep, handcrafted with care for every family.
            </p>
            <div className="flex gap-3">
              <a href="https://wa.me/918374530026" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center hover:scale-110 transition-transform">
                <WhatsAppIcon />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Youtube size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body font-semibold text-white text-base mb-4">Quick Links</h4>
            <ul className="space-y-2.5 font-body text-sm text-white/60">
              {[
                { to: "/", label: "Home" },
                { to: "/products", label: "All Products" },
                { to: "/products?category=mattresses", label: "Mattresses" },
                { to: "/products?category=pillows", label: "Pillows" },
                { to: "/products?category=services", label: "Services" },
                { to: "/cart", label: "Shopping Cart" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-accent transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h4 className="font-body font-semibold text-white text-base mb-4">Customer</h4>
            <ul className="space-y-2.5 font-body text-sm text-white/60">
              {[
                { to: "/login", label: "My Account" },
                { to: "/dashboard/orders", label: "Track Order" },
                { to: "/wishlist", label: "Wishlist" },
                { to: "/dashboard/addresses", label: "Saved Addresses" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-accent transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body font-semibold text-white text-base mb-4">Contact</h4>
            <div className="space-y-4 font-body text-sm text-white/60">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="shrink-0 mt-0.5 text-accent" />
                <span>Tirupathi, Andhra Pradesh, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-accent" />
                <a href="tel:+918374530026" className="hover:text-accent transition-colors">+91 83745 30026</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-accent" />
                <a href="mailto:info@latexleep.com" className="hover:text-accent transition-colors">info@latexleep.com</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-white/40 font-body">
          <p>© 2026 LATEX Leep. All rights reserved.</p>
          <p>Owner: Malik Basha</p>
        </div>
      </div>
    </footer>
  );
}

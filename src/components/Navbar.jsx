import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, Heart, User, Search, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useWishlist } from "../contexts/WishlistContext.jsx";

function Logo() {
  return <><span className="font-heading text-2xl font-bold text-primary-foreground">LATEX <span className="text-accent">Leep</span></span></>;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary border-b border-primary/20 shadow-sm">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="shrink-0"><Logo /></Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 font-body text-sm font-medium">
            <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Home</Link>
            <Link to="/products" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Products</Link>
            <Link to="/products?category=mattresses" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Mattresses</Link>
            <Link to="/products?category=pillows" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Pillows</Link>
            <Link to="/products?category=services" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Services</Link>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-primary-foreground/80 hover:text-primary-foreground p-1.5">
              <Search size={20} />
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative text-primary-foreground/80 hover:text-primary-foreground p-1.5">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">{wishlistCount}</span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative text-primary-foreground/80 hover:text-primary-foreground p-1.5">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">{itemCount}</span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="relative hidden md:block">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground font-body text-sm font-medium">
                  <User size={18} />{user.name.split(" ")[0]}<ChevronDown size={14} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-xl min-w-[160px] overflow-hidden z-50">
                    <Link to="/dashboard" className="block px-4 py-3 text-sm hover:bg-secondary transition-colors" onClick={() => setUserMenuOpen(false)}>My Dashboard</Link>
                    <Link to="/dashboard/orders" className="block px-4 py-3 text-sm hover:bg-secondary transition-colors" onClick={() => setUserMenuOpen(false)}>My Orders</Link>
                    <Link to="/wishlist" className="block px-4 py-3 text-sm hover:bg-secondary transition-colors" onClick={() => setUserMenuOpen(false)}>Wishlist</Link>
                    <hr className="border-border" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-destructive hover:bg-secondary flex items-center gap-2">
                      <LogOut size={14} />Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden md:flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors">
                <User size={16} />Login
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button className="md:hidden text-primary-foreground p-1" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="py-3 border-t border-primary/20">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
              <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-accent-foreground text-sm font-semibold">Search</button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-primary border-t border-primary/20">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {[
              { to: "/", label: "Home" },
              { to: "/products", label: "All Products" },
              { to: "/products?category=mattresses", label: "Mattresses" },
              { to: "/products?category=pillows", label: "Pillows" },
              { to: "/products?category=services", label: "Services" },
              { to: "/cart", label: `Cart (${itemCount})` },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="text-primary-foreground/90 font-medium py-2.5 border-b border-primary/20 last:border-0" onClick={() => setIsOpen(false)}>
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" className="text-primary-foreground/90 font-medium py-2.5 border-b border-primary/20" onClick={() => setIsOpen(false)}>My Dashboard</Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="text-left text-red-300 font-medium py-2.5">Logout</button>
              </>
            ) : (
              <Link to="/login" className="mt-2 rounded-lg bg-accent px-4 py-3 text-accent-foreground font-semibold text-center" onClick={() => setIsOpen(false)}>Login / Register</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

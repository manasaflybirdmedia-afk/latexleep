import React, { createContext, useContext, useEffect, useState } from "react";
import { customers } from "../lib/api.js";
import { useAuth } from "./AuthContext.jsx";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wishlist_ids") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    if (user) {
      customers.getWishlist()
        .then((d) => {
          const ids = d.items.map((i) => i.product_id);
          setWishlist(ids);
          localStorage.setItem("wishlist_ids", JSON.stringify(ids));
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("wishlist_ids", JSON.stringify(wishlist));
  }, [wishlist]);

  const toggle = async (productId) => {
    const inList = wishlist.includes(productId);
    if (user) {
      try {
        if (inList) {
          await customers.removeFromWishlist(productId);
          setWishlist((w) => w.filter((id) => id !== productId));
        } else {
          await customers.addToWishlist(productId);
          setWishlist((w) => [...w, productId]);
        }
      } catch {}
    } else {
      setWishlist((w) => inList ? w.filter((id) => id !== productId) : [...w, productId]);
    }
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isInWishlist, count: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}

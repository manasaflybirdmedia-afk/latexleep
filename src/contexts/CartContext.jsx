import React, { createContext, useContext, useEffect, useReducer } from "react";

const CartContext = createContext(null);

const initialState = { items: [], coupon: null, couponDiscount: 0 };

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.id === action.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.product.id
              ? { ...i, quantity: i.quantity + (action.quantity || 1) }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.product, quantity: action.quantity || 1 }] };
    }
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "UPDATE_QTY":
      if (action.quantity <= 0) return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      return { ...state, items: state.items.map((i) => (i.id === action.id ? { ...i, quantity: action.quantity } : i)) };
    case "CLEAR":
      return { ...initialState };
    case "SET_COUPON":
      return { ...state, coupon: action.coupon, couponDiscount: action.discount };
    case "REMOVE_COUPON":
      return { ...state, coupon: null, couponDiscount: 0 };
    case "LOAD":
      return { ...state, items: action.items };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, () => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? { ...initialState, items: JSON.parse(saved) } : initialState;
    } catch {
      return initialState;
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (product, quantity = 1) => dispatch({ type: "ADD", product, quantity });
  const removeFromCart = (id) => dispatch({ type: "REMOVE", id });
  const updateQuantity = (id, quantity) => dispatch({ type: "UPDATE_QTY", id, quantity });
  const clearCart = () => dispatch({ type: "CLEAR" });
  const applyCoupon = (coupon, discount) => dispatch({ type: "SET_COUPON", coupon, discount });
  const removeCoupon = () => dispatch({ type: "REMOVE_COUPON" });

  const subtotal = state.items.reduce((sum, i) => {
    const price = i.discount_price || i.price;
    return sum + price * i.quantity;
  }, 0);

  const shippingCharge = subtotal > 5000 ? 0 : subtotal > 0 ? 99 : 0;
  const tax = Math.round((subtotal - state.couponDiscount) * 0.18 * 100) / 100;
  const total = Math.max(0, subtotal - state.couponDiscount + shippingCharge + tax);
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: state.items, coupon: state.coupon, couponDiscount: state.couponDiscount,
      subtotal, shippingCharge, tax, total, itemCount,
      addToCart, removeFromCart, updateQuantity, clearCart, applyCoupon, removeCoupon,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

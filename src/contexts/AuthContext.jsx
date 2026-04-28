import React, { createContext, useContext, useEffect, useState } from "react";
import { auth as authApi } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const userToken = localStorage.getItem("user_token");
      const adminToken = localStorage.getItem("admin_token");

      const promises = [];
      if (userToken) {
        promises.push(
          authApi.me()
            .then((d) => setUser(d.user))
            .catch(() => localStorage.removeItem("user_token"))
        );
      }
      if (adminToken) {
        promises.push(
          authApi.adminMe()
            .then((d) => setAdmin(d.admin))
            .catch(() => localStorage.removeItem("admin_token"))
        );
      }
      await Promise.allSettled(promises);
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem("user_token", data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, phone) => {
    const data = await authApi.register({ name, email, password, phone });
    localStorage.setItem("user_token", data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("user_token");
    setUser(null);
  };

  const adminLogin = async (email, password) => {
    const data = await authApi.adminLogin({ email, password });
    localStorage.setItem("admin_token", data.token);
    setAdmin(data.admin);
    return data;
  };

  const adminLogout = () => {
    localStorage.removeItem("admin_token");
    setAdmin(null);
  };

  const updateUser = (updated) => setUser((prev) => ({ ...prev, ...updated }));
  const updateAdmin = (updated) => setAdmin((prev) => ({ ...prev, ...updated }));

  return (
    <AuthContext.Provider value={{ user, admin, loading, login, register, logout, adminLogin, adminLogout, updateUser, updateAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

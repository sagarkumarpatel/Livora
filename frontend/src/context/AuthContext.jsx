import { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiClient, { setAuthToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/api/auth/me");
      setUser(data.user);
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    const { data } = await apiClient.post("/api/auth/login", credentials);
    setAuthToken(data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (payload) => {
    const { data } = await apiClient.post("/api/auth/signup", payload);
    setAuthToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

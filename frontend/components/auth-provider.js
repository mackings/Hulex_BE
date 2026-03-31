"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe } from "@/lib/api";

const TOKEN_KEY = "hulex-flow-token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setIsHydrated(true);
      return;
    }

    setToken(storedToken);
    setIsLoadingUser(true);

    getMe(storedToken)
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoadingUser(false);
        setIsHydrated(true);
      });
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isHydrated,
      isLoadingUser,
      isAuthenticated: Boolean(token),
      setSession(nextToken, nextUser) {
        window.localStorage.setItem(TOKEN_KEY, nextToken);
        setToken(nextToken);
        setUser(nextUser ?? null);
      },
      async refreshUser(activeToken = token) {
        if (!activeToken) {
          setUser(null);
          return null;
        }

        setIsLoadingUser(true);

        try {
          const data = await getMe(activeToken);
          setUser(data.user);
          return data.user;
        } finally {
          setIsLoadingUser(false);
        }
      },
      clearSession() {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    }),
    [isHydrated, isLoadingUser, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

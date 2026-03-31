"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { deleteSession, getMe } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  useEffect(() => {
    setIsLoadingUser(true);

    getMe()
      .then((data) => {
        setUser(data.user);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsLoadingUser(false);
        setIsHydrated(true);
      });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isHydrated,
      isLoadingUser,
      isAuthenticated,
      setSession(nextUser) {
        setUser(nextUser ?? null);
        setIsAuthenticated(true);
      },
      async refreshUser() {
        setIsLoadingUser(true);

        try {
          const data = await getMe();
          setUser(data.user);
          setIsAuthenticated(true);
          return data.user;
        } catch (error) {
          setUser(null);
          setIsAuthenticated(false);
          return null;
        } finally {
          setIsLoadingUser(false);
        }
      },
      async clearSession() {
        try {
          await deleteSession();
        } catch {}
        setUser(null);
        setIsAuthenticated(false);
      }
    }),
    [isAuthenticated, isHydrated, isLoadingUser, user]
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

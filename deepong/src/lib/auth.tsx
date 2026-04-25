"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

const API_BASE = "http://localhost:4000/api/v1";

interface User {
  id: number;
  email: string;
  nickname: string;
  handle: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          // 토큰 만료 시 리프레시 시도
          if (res.status === 401) {
            const refreshed = await tryRefresh();
            if (!refreshed) logout();
          }
          return;
        }
        const data = await res.json();
        setUser({
          id: data.id,
          email: data.email,
          nickname: data.nickname,
          handle: data.handle,
          avatarUrl: data.avatarUrl,
        });
      })
      .catch(() => logout())
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tryRefresh = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // 새 토큰으로 유저 정보 재조회
      const meRes = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      if (!meRes.ok) return false;

      const me = await meRes.json();
      setUser({
        id: me.id,
        email: me.email,
        nickname: me.nickname,
        handle: me.handle,
        avatarUrl: me.avatarUrl,
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      logout,
    }),
    [user, isLoading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

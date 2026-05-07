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
import type { ProfileDto, WorkspaceDto } from "@/features/settings/types";

const API_BASE = "http://localhost:4000/api/v1";

interface AuthState {
  user: ProfileDto | null;
  workspace: WorkspaceDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshMe: () => Promise<void>;
  setUser: (user: ProfileDto) => void;
  setWorkspace: (workspace: WorkspaceDto) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  workspace: null,
  isLoading: true,
  isAuthenticated: false,
  refreshMe: async () => {},
  setUser: () => {},
  setWorkspace: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchMe(token: string): Promise<{
  user: ProfileDto;
  workspace: WorkspaceDto;
} | null> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.user) return null;
  return { user: data.user, workspace: data.workspace ?? null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<ProfileDto | null>(null);
  const [workspace, setWorkspaceState] = useState<WorkspaceDto | null>(null);
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
    setUserState(null);
    setWorkspaceState(null);
  }, []);

  const tryRefresh = useCallback(async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return data.accessToken as string;
    } catch {
      return null;
    }
  }, []);

  const refreshMe = useCallback(async () => {
    let token = localStorage.getItem("accessToken");
    if (!token) {
      setUserState(null);
      setWorkspaceState(null);
      return;
    }

    let me = await fetchMe(token);
    if (!me) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        token = refreshed;
        me = await fetchMe(token);
      }
    }

    if (!me) {
      logout();
      return;
    }

    setUserState(me.user);
    setWorkspaceState(me.workspace);
  }, [logout, tryRefresh]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshMe().finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      workspace,
      isLoading,
      isAuthenticated: !!user,
      refreshMe,
      setUser: setUserState,
      setWorkspace: setWorkspaceState,
      logout,
    }),
    [user, workspace, isLoading, refreshMe, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

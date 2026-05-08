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
import { API_BASE } from "@/lib/config";

const DEMO_USER: ProfileDto = {
  id: "demo-user",
  email: "demo@deepong.dev",
  nickname: "Oscar",
  handle: "oscar",
  bio: "디퐁 데모 계정",
  avatarUrl: null,
  timezone: "Asia/Seoul",
  locale: "ko-KR",
};

const DEMO_WORKSPACE: WorkspaceDto = {
  workDays: [1, 2, 3, 4, 5],
  workStartTime: "10:00",
  workEndTime: "18:30",
  lunchBreak: true,
  shareWorktime: true,
};

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

    // 백엔드 미가동 데모 환경 — API에 닿지 않으면 데모 유저로 폴백
    const shouldUseDemoFallback = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(800),
        });
        return !res.ok;
      } catch {
        return true;
      }
    };

    if (!token) {
      if (await shouldUseDemoFallback()) {
        setUserState(DEMO_USER);
        setWorkspaceState(DEMO_WORKSPACE);
        return;
      }
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
      if (await shouldUseDemoFallback()) {
        setUserState(DEMO_USER);
        setWorkspaceState(DEMO_WORKSPACE);
        return;
      }
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

"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/app/_components/Button";
import { ProfileSection } from "@/features/settings/ProfileSection";
import { WorkspaceSection } from "@/features/settings/WorkspaceSection";
import { getMe } from "@/features/settings/api";
import {
  ProfileDto,
  SettingsApiError,
  WorkspaceDto,
} from "@/features/settings/types";

type LoadState =
  | { type: "loading" }
  | { type: "ready"; profile: ProfileDto; workspace: WorkspaceDto }
  | { type: "error"; message: string };

export default function SettingsPage() {
  const { setUser, setWorkspace } = useAuth();
  const [state, setState] = useState<LoadState>({ type: "loading" });

  const load = async () => {
    setState({ type: "loading" });
    try {
      const me = await getMe();
      setUser(me.user);
      setWorkspace(me.workspace);
      setState({ type: "ready", profile: me.user, workspace: me.workspace });
    } catch (err) {
      const message =
        err instanceof SettingsApiError
          ? (err.fieldMessage ?? "내 정보를 불러오지 못했어요.")
          : "서버에 연결할 수 없어요.";
      setState({ type: "error", message });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.type === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2f6bff] border-t-transparent" />
          <p className="text-sm text-[#8b95a1] font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (state.type === "error") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-[#8b95a1] font-medium">{state.message}</p>
          <Button variant="ghost" size="sm" onClick={load}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#e5e8eb] bg-white px-8 pb-5 pt-6">
        <h1 className="text-[22px] font-bold tracking-tight text-[#191f28]">
          설정
        </h1>
        <p className="mt-0.5 text-[13px] text-[#6b7684]">
          프로필과 업무 시간을 관리하세요.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#f9fafb] px-8 py-6">
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5">
          <ProfileSection
            initialProfile={state.profile}
            onSaved={(profile) => {
              setUser(profile);
              setState((prev) =>
                prev.type === "ready" ? { ...prev, profile } : prev,
              );
            }}
          />
          <WorkspaceSection
            initialWorkspace={state.workspace}
            onSaved={(workspace) => {
              setWorkspace(workspace);
              setState((prev) =>
                prev.type === "ready" ? { ...prev, workspace } : prev,
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

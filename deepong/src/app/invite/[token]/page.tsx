"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/app/_components/Avatar";
import { Button } from "@/app/_components/Button";
import { Card } from "@/app/_components/Card";
import EmptyState from "@/app/_components/EmptyState";
import {
  previewInvitation,
  acceptInvitation,
  InvitationApiError,
} from "@/features/invitation/api";
import type {
  InvitationPreviewResponse,
  InvitationError,
} from "@/features/invitation/types";
import { UserPlus, ArrowLeft } from "lucide-react";

type PageState =
  | { type: "loading" }
  | { type: "preview"; data: InvitationPreviewResponse }
  | { type: "accepting" }
  | { type: "accepted" }
  | { type: "error"; code: InvitationError };

const ERROR_MAP: Record<
  InvitationError,
  { title: string; description: string }
> = {
  expired: {
    title: "만료된 초대 링크예요",
    description: "이 초대 링크는 더 이상 유효하지 않아요.\n새로운 링크를 받아보세요.",
  },
  "not-found": {
    title: "존재하지 않는 초대예요",
    description: "초대 링크가 올바르지 않거나 이미 사용되었어요.",
  },
  "self-accept": {
    title: "내가 만든 초대예요",
    description: "자신이 만든 초대 링크는 수락할 수 없어요.",
  },
  blocked: {
    title: "수락할 수 없는 초대예요",
    description: "이 초대를 수락할 수 없습니다.",
  },
  unknown: {
    title: "문제가 발생했어요",
    description: "잠시 후 다시 시도해주세요.",
  },
};

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [state, setState] = useState<PageState>({ type: "loading" });

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace(`/auth?redirect=/invite/${token}`);
      return;
    }

    previewInvitation(token)
      .then((data) => setState({ type: "preview", data }))
      .catch((err) => {
        if (err instanceof InvitationApiError) {
          setState({ type: "error", code: err.code });
        } else {
          setState({ type: "error", code: "unknown" });
        }
      });
  }, [token, authLoading, isAuthenticated, router]);

  const handleAccept = useCallback(async () => {
    setState({ type: "accepting" });

    try {
      await acceptInvitation(token);
      setState({ type: "accepted" });
    } catch (err) {
      if (err instanceof InvitationApiError) {
        setState({ type: "error", code: err.code });
      } else {
        setState({ type: "error", code: "unknown" });
      }
    }
  }, [token]);

  if (authLoading || (state.type === "loading" && !isAuthenticated)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-subtle)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
          <p className="text-sm text-[var(--gray-400)] font-medium">
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-subtle)] p-4">
      <div className="w-full max-w-[400px]">
        {state.type === "loading" && (
          <Card variant="elevated" padding="lg" className="text-center">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
              <p className="text-[13px] text-[var(--gray-500)]">
                초대 정보를 불러오는 중...
              </p>
            </div>
          </Card>
        )}

        {state.type === "preview" && (
          <Card variant="elevated" padding="lg">
            <div className="flex flex-col items-center gap-4 text-center">
              <Avatar
                name={state.data.inviter.nickname}
                size="2xl"
                color="blue"
                profile={state.data.inviter.avatarUrl ?? undefined}
              />

              <div>
                <h2 className="text-[17px] font-bold text-[var(--gray-900)]">
                  {state.data.inviter.nickname}
                </h2>
                <p className="text-[13px] text-[var(--gray-500)]">
                  @{state.data.inviter.handle}
                </p>
              </div>

              <p className="text-[13px] text-[var(--gray-600)] leading-relaxed">
                <strong>{state.data.inviter.nickname}</strong>님이 친구가 되고
                싶어해요!
              </p>

              <Button
                variant="primary"
                fullWidth
                onClick={handleAccept}
                leftIcon={<UserPlus size={16} />}
              >
                친구 수락하기
              </Button>
            </div>
          </Card>
        )}

        {state.type === "accepting" && (
          <Card variant="elevated" padding="lg" className="text-center">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
              <p className="text-[13px] text-[var(--gray-500)]">
                수락하는 중...
              </p>
            </div>
          </Card>
        )}

        {state.type === "accepted" && (
          <Card variant="elevated" padding="lg">
            <div className="flex flex-col items-center gap-4 text-center">
              <EmptyState
                variant="celebrate"
                title="친구가 되었어요!"
                description="이제 대화를 시작할 수 있어요."
              />
              <Button
                variant="primary"
                fullWidth
                onClick={() => router.push("/")}
                leftIcon={<ArrowLeft size={16} />}
              >
                홈으로 가기
              </Button>
            </div>
          </Card>
        )}

        {state.type === "error" && (
          <Card variant="elevated" padding="lg">
            <div className="flex flex-col items-center gap-4 text-center">
              <EmptyState
                variant="offline"
                title={ERROR_MAP[state.code].title}
                description={ERROR_MAP[state.code].description}
              />
              <Button
                variant="secondary"
                fullWidth
                onClick={() => router.push("/")}
                leftIcon={<ArrowLeft size={16} />}
              >
                홈으로 돌아가기
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

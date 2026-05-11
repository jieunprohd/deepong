"use client";

import React, { useState } from "react";
import { Modal } from "@/app/_components/Modal";
import { Avatar, AvatarColor } from "@/app/_components/Avatar";
import { Switch } from "@/app/_components/Switch";
import { Button } from "@/app/_components/Button";
import { Star, BellOff } from "lucide-react";
import {
  type CommunicationNorm,
  type DefaultTone,
  type FeedPriority,
  type UpsertNormInput,
} from "./norm-api";

export type { CommunicationNorm, DefaultTone, FeedPriority } from "./norm-api";

export interface NormPeer {
  id: string;
  nickname: string;
  handle: string;
  avatarUrl?: string;
  color?: AvatarColor;
}

export interface CommunicationNormModalProps {
  isOpen: boolean;
  onClose: () => void;
  peer: NormPeer;
  initialNorm: CommunicationNorm;
  onSave: (patch: UpsertNormInput) => Promise<void> | void;
  className?: string;
}

const TONE_LABELS: Record<
  DefaultTone,
  { emoji: string; label: string; description: string }
> = {
  CHAT: { emoji: "💬", label: "수다", description: "가벼운 잡담이 기본" },
  ASK: { emoji: "🤔", label: "물어봄", description: "답이 필요한 질문이 기본" },
  URGENT: { emoji: "⚡", label: "급함", description: "빠른 확인이 필요" },
  SHARE: { emoji: "📎", label: "공유", description: "링크·파일이 기본" },
};

const PRIORITY_OPTIONS: { value: FeedPriority; label: string }[] = [
  { value: "LOW", label: "낮음" },
  { value: "NORMAL", label: "보통" },
  { value: "HIGH", label: "높음" },
];

type Draft = {
  defaultTone: DefaultTone;
  allowUrgent: boolean;
  shareReadReceipt: boolean;
  sharePresence: boolean;
  shareWorktime: boolean;
  feedPriority: FeedPriority;
  nicknameMemo: string;
  muted: boolean;
};

function toDraft(n: CommunicationNorm): Draft {
  return {
    defaultTone: n.defaultTone,
    allowUrgent: n.allowUrgent,
    shareReadReceipt: n.shareReadReceipt,
    sharePresence: n.sharePresence,
    shareWorktime: n.shareWorktime,
    feedPriority: n.feedPriority,
    nicknameMemo: n.nicknameMemo ?? "",
    muted: n.muted,
  };
}

function diff(initial: Draft, draft: Draft): UpsertNormInput {
  const patch: UpsertNormInput = {};
  if (draft.defaultTone !== initial.defaultTone)
    patch.defaultTone = draft.defaultTone;
  if (draft.allowUrgent !== initial.allowUrgent)
    patch.allowUrgent = draft.allowUrgent;
  if (draft.shareReadReceipt !== initial.shareReadReceipt)
    patch.shareReadReceipt = draft.shareReadReceipt;
  if (draft.sharePresence !== initial.sharePresence)
    patch.sharePresence = draft.sharePresence;
  if (draft.shareWorktime !== initial.shareWorktime)
    patch.shareWorktime = draft.shareWorktime;
  if (draft.feedPriority !== initial.feedPriority)
    patch.feedPriority = draft.feedPriority;
  if (draft.muted !== initial.muted) patch.muted = draft.muted;
  const memoNext =
    draft.nicknameMemo.trim().length === 0 ? null : draft.nicknameMemo;
  if (
    memoNext !==
    (initial.nicknameMemo.trim().length === 0 ? null : initial.nicknameMemo)
  ) {
    patch.nicknameMemo = memoNext;
  }
  return patch;
}

export const CommunicationNormModal: React.FC<CommunicationNormModalProps> = ({
  isOpen,
  onClose,
  peer,
  initialNorm,
  onSave,
  className = "",
}) => {
  const initialDraft = toDraft(initialNorm);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = diff(initialDraft, draft);
  const isDirty = Object.keys(patch).length > 0;

  const handleSave = async () => {
    if (!isDirty) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(patch);
    } catch {
      setError("저장에 실패했어요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="알림 규범"
      className={`max-w-[480px] ${className}`}
    >
      <div className="flex flex-col gap-5">
        {/* Peer header */}
        <div className="flex items-center gap-3 rounded-[var(--r-md)] bg-[var(--gray-50)] p-3">
          <Avatar
            name={peer.nickname}
            color={peer.color ?? "blue"}
            profile={peer.avatarUrl}
            size="lg"
            hover={false}
          />
          <div>
            <div className="text-[14px] font-bold text-[var(--gray-900)]">
              {peer.nickname}
            </div>
            <div className="text-[11px] text-[var(--gray-500)]">
              @{peer.handle}
            </div>
          </div>
        </div>

        {/* 별명 메모 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-[#4e5968]">
            별명 메모 (선택)
          </label>
          <input
            type="text"
            value={draft.nicknameMemo}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, nicknameMemo: e.target.value }))
            }
            placeholder="이 친구를 어떻게 부를지 메모"
            maxLength={100}
            className="rounded-lg border border-[#e5e8eb] bg-[#f9fafb] px-3 py-2 text-sm outline-none focus:border-[#2f6bff] focus:bg-white"
          />
        </div>

        {/* 우선 친구 / 음소거 */}
        <div className="flex flex-col gap-2">
          <Switch
            checked={draft.feedPriority === "HIGH"}
            onChange={(checked) =>
              setDraft((prev) => ({
                ...prev,
                feedPriority: checked ? "HIGH" : "NORMAL",
              }))
            }
            label={
              <span className="inline-flex items-center gap-1.5">
                <Star size={13} className="text-[var(--warning)]" />
                우선 친구
              </span>
            }
            description="집중 모드 중에도 이 친구의 알림은 받아요"
          />
          <Switch
            checked={draft.muted}
            onChange={(checked) =>
              setDraft((prev) => ({ ...prev, muted: checked }))
            }
            label={
              <span className="inline-flex items-center gap-1.5">
                <BellOff size={13} className="text-[var(--danger)]" />
                음소거
              </span>
            }
            description="이 친구의 메시지는 알림 없이 모아둡니다"
          />
        </div>

        {/* 기본 톤 */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
            기본 톤
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(TONE_LABELS) as DefaultTone[]).map((tone) => {
              const info = TONE_LABELS[tone];
              const active = draft.defaultTone === tone;
              return (
                <button
                  key={tone}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, defaultTone: tone }))
                  }
                  className={`flex flex-col items-center justify-center rounded-[var(--r-sm)] py-2 transition-all ${
                    active
                      ? "bg-[var(--brand-primary)] text-white shadow-[var(--shadow-xs)]"
                      : "bg-[var(--gray-50)] text-[var(--gray-700)] hover:bg-[var(--gray-100)]"
                  }`}
                  title={info.description}
                  type="button"
                >
                  <span className="text-[14px]">{info.emoji}</span>
                  <span className="text-[11px] font-bold">{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 피드 우선순위 */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
            피드 우선순위
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {PRIORITY_OPTIONS.map((opt) => {
              const active = draft.feedPriority === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, feedPriority: opt.value }))
                  }
                  className={`rounded-[var(--r-sm)] py-2 text-[12px] font-bold transition-all ${
                    active
                      ? "bg-[var(--brand-primary)] text-white shadow-[var(--shadow-xs)]"
                      : "bg-[var(--gray-50)] text-[var(--gray-700)] hover:bg-[var(--gray-100)]"
                  }`}
                  type="button"
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 공유 설정 */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
            공유
          </div>
          <Switch
            checked={draft.allowUrgent}
            onChange={(checked) =>
              setDraft((prev) => ({ ...prev, allowUrgent: checked }))
            }
            label="긴급 알림 허용"
            description="이 친구가 보낸 '급함' 메시지는 항상 즉시 알림"
          />
          <Switch
            checked={draft.shareReadReceipt}
            onChange={(checked) =>
              setDraft((prev) => ({ ...prev, shareReadReceipt: checked }))
            }
            label="읽음 표시 공유"
          />
          <Switch
            checked={draft.sharePresence}
            onChange={(checked) =>
              setDraft((prev) => ({ ...prev, sharePresence: checked }))
            }
            label="상태(프레즌스) 공유"
          />
          <Switch
            checked={draft.shareWorktime}
            onChange={(checked) =>
              setDraft((prev) => ({ ...prev, shareWorktime: checked }))
            }
            label="업무 시간 공유"
          />
        </div>

        {error && <p className="text-[13px] text-[var(--danger)]">{error}</p>}

        {/* Footer */}
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" size="md" fullWidth onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            disabled={!isDirty || isSaving}
            isLoading={isSaving}
            onClick={handleSave}
          >
            저장
          </Button>
        </div>
      </div>
    </Modal>
  );
};

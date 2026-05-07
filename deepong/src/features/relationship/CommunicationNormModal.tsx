"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/app/_components/Modal";
import { Avatar, AvatarColor } from "@/app/_components/Avatar";
import { Switch } from "@/app/_components/Switch";
import { Button } from "@/app/_components/Button";
import { Star, Ban } from "lucide-react";

export type DeliveryRule = "immediate" | "batched" | "queued" | "off";
export type Tone = "chat" | "ask" | "urgent" | "share";

export interface CommunicationNorm {
  /** 톤별 알림 정책 */
  rules: Record<Tone, DeliveryRule>;
  /** 우선 친구 (집중 모드 중에도 즉시 알림) */
  isPriority: boolean;
  /** 차단 (모든 알림 차단) */
  isBlocked: boolean;
}

export interface NormPeer {
  id: string;
  nickname: string;
  handle: string;
  avatarUrl?: string;
  color?: AvatarColor;
}

export interface CommunicationNormModalProps {
  /** 모달 열림 여부 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 대상 친구 정보 */
  peer: NormPeer;
  /** 현재 규범 */
  initialNorm: CommunicationNorm;
  /** 저장 콜백 (모달 닫기는 호출 측에서) */
  onSave: (norm: CommunicationNorm) => void;
  className?: string;
}

const TONE_LABELS: Record<
  Tone,
  { emoji: string; label: string; description: string }
> = {
  chat: {
    emoji: "💬",
    label: "수다",
    description: "가벼운 잡담",
  },
  ask: {
    emoji: "🤔",
    label: "물어봄",
    description: "답이 필요한 질문",
  },
  urgent: {
    emoji: "⚡",
    label: "급함",
    description: "빠른 확인이 필요한 일",
  },
  share: {
    emoji: "📎",
    label: "공유",
    description: "링크/이미지/파일",
  },
};

const RULE_OPTIONS: {
  value: DeliveryRule;
  label: string;
  description: string;
}[] = [
  { value: "immediate", label: "즉시", description: "받자마자 알림" },
  { value: "batched", label: "모아서", description: "쉴 때 한 번에" },
  { value: "queued", label: "조용히", description: "안 보이게 모아둠" },
  { value: "off", label: "끔", description: "알림 안 옴" },
];

export const CommunicationNormModal: React.FC<CommunicationNormModalProps> = ({
  isOpen,
  onClose,
  peer,
  initialNorm,
  onSave,
  className = "",
}) => {
  const [norm, setNorm] = useState<CommunicationNorm>(initialNorm);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setNorm(initialNorm);
  }, [isOpen, initialNorm]);

  const setRule = (tone: Tone, rule: DeliveryRule) => {
    setNorm((prev) => ({
      ...prev,
      rules: { ...prev.rules, [tone]: rule },
    }));
  };

  const handleSave = () => {
    onSave(norm);
  };

  const isDirty = JSON.stringify(norm) !== JSON.stringify(initialNorm);
  const disabled = norm.isBlocked;

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

        {/* Priority / Block */}
        <div className="flex flex-col gap-2">
          <Switch
            checked={norm.isPriority}
            onChange={(checked) =>
              setNorm((prev) => ({
                ...prev,
                isPriority: checked,
                isBlocked: checked ? false : prev.isBlocked,
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
            checked={norm.isBlocked}
            onChange={(checked) =>
              setNorm((prev) => ({
                ...prev,
                isBlocked: checked,
                isPriority: checked ? false : prev.isPriority,
              }))
            }
            label={
              <span className="inline-flex items-center gap-1.5">
                <Ban size={13} className="text-[var(--danger)]" />
                알림 차단
              </span>
            }
            description="이 친구의 모든 메시지에 대한 알림을 끕니다"
          />
        </div>

        {/* Tone rules */}
        <div
          className={`flex flex-col gap-3 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
            톤별 알림 방식
          </div>
          {(Object.keys(TONE_LABELS) as Tone[]).map((tone) => {
            const info = TONE_LABELS[tone];
            const current = norm.rules[tone];
            return (
              <div
                key={tone}
                className="rounded-[var(--r-md)] border border-[var(--gray-200)] p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--gray-900)]">
                      {info.emoji} {info.label}
                    </div>
                    <div className="text-[11px] text-[var(--gray-500)]">
                      {info.description}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {RULE_OPTIONS.map((opt) => {
                    const isActive = current === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setRule(tone, opt.value)}
                        className={`
                          flex flex-col items-center justify-center
                          rounded-[var(--r-sm)] py-2 transition-all
                          ${
                            isActive
                              ? "bg-[var(--brand-primary)] text-white shadow-[var(--shadow-xs)]"
                              : "bg-[var(--gray-50)] text-[var(--gray-700)] hover:bg-[var(--gray-100)]"
                          }
                        `}
                        title={opt.description}
                      >
                        <span className="text-[12px] font-bold">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" size="md" fullWidth onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            disabled={!isDirty}
            onClick={handleSave}
          >
            저장
          </Button>
        </div>
      </div>
    </Modal>
  );
};

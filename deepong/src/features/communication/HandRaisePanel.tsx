"use client";

import React from "react";
import { Hand, Check, Clock } from "lucide-react";
import { Avatar, AvatarColor } from "@/app/_components/Avatar";

export interface HandRaiseUser {
  id: string;
  name: string;
  color?: AvatarColor;
  avatarUrl?: string;
  /** 손든 시각 (예: "방금", "5분 전") */
  raisedAt: string;
}

export interface HandRaisePanelProps {
  /** 손들기 대상 메시지 요약 (예: 질문 텍스트) */
  questionText: string;
  /** 질문자 이름 */
  questionAuthor: string;
  /** 손든 사용자 목록 */
  raisedBy: HandRaiseUser[];
  /** 본인이 손든 상태인지 */
  isRaised: boolean;
  /** 손들기/내리기 콜백 */
  onToggle: () => void;
  /** 본인 자신이 질문한 경우 (손들기 비활성화) */
  isOwnQuestion?: boolean;
  className?: string;
}

export const HandRaisePanel: React.FC<HandRaisePanelProps> = ({
  questionText,
  questionAuthor,
  raisedBy,
  isRaised,
  onToggle,
  isOwnQuestion = false,
  className = "",
}) => {
  const count = raisedBy.length;

  return (
    <div
      className={`
        rounded-[var(--r-lg)] border border-[var(--gray-200)] bg-white
        shadow-[var(--shadow-xs)]
        ${className}
      `}
    >
      {/* 질문 섹션 */}
      <div className="border-l-[3px] border-l-[var(--warning)] px-4 py-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--warning)]">
          🤔 물어봄
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--gray-800)]">
          {questionText}
        </p>
        <p className="mt-2 text-[11px] text-[var(--gray-500)]">
          — {questionAuthor}
        </p>
      </div>

      {/* 손들기 액션 */}
      <div className="flex items-center justify-between border-t border-[var(--gray-100)] bg-[var(--gray-50)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Hand
            size={16}
            className={
              isRaised
                ? "text-[var(--brand-primary)]"
                : "text-[var(--gray-400)]"
            }
            strokeWidth={2.2}
          />
          <span className="text-[12px] font-semibold text-[var(--gray-700)]">
            {count > 0 ? `${count}명이 답할게요` : "아직 답한 사람 없음"}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggle}
          disabled={isOwnQuestion}
          className={`
            inline-flex items-center gap-1.5 h-8 rounded-full px-3
            text-[12px] font-bold transition-all
            disabled:opacity-40 disabled:pointer-events-none
            ${
              isRaised
                ? "bg-[var(--brand-primary)] text-white shadow-sm hover:bg-[var(--brand-primary-hover)]"
                : "bg-white text-[var(--gray-700)] border border-[var(--gray-200)] hover:bg-[var(--gray-100)]"
            }
          `}
        >
          {isRaised ? (
            <>
              <Check size={13} strokeWidth={2.6} />
              답할게요
            </>
          ) : (
            <>
              <Hand size={13} strokeWidth={2.4} />
              내가 답할게요
            </>
          )}
        </button>
      </div>

      {/* 손든 사람 목록 */}
      {count > 0 && (
        <div className="border-t border-[var(--gray-100)] px-4 py-3">
          <ul className="flex flex-col gap-2">
            {raisedBy.map((u) => (
              <li key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={u.name}
                    color={u.color ?? "blue"}
                    size="sm"
                    profile={u.avatarUrl}
                    hover={false}
                  />
                  <span className="text-[13px] font-semibold text-[var(--gray-800)]">
                    {u.name}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-[var(--gray-500)]">
                  <Clock size={10} />
                  {u.raisedAt}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

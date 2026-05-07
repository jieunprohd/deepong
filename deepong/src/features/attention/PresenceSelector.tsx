"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Edit3 } from "lucide-react";

export type Presence = "free" | "working" | "focus" | "off";

export interface PresenceOption {
  value: Presence;
  label: string;
  description: string;
  emoji: string;
  color: string;
  bg: string;
}

const OPTIONS: PresenceOption[] = [
  {
    value: "free",
    label: "여유",
    description: "지금 대화 가능",
    emoji: "🟢",
    color: "#00c471",
    bg: "#e6f9f1",
  },
  {
    value: "working",
    label: "일하는 중",
    description: "급한 것만 알림이 가요",
    emoji: "🟡",
    color: "#ff9500",
    bg: "#fff4e5",
  },
  {
    value: "focus",
    label: "집중 모드",
    description: "방해 없이 집중하고 싶어요",
    emoji: "🔵",
    color: "#3182f6",
    bg: "#e8f2fe",
  },
  {
    value: "off",
    label: "오프라인",
    description: "지금은 자리에 없어요",
    emoji: "⚪",
    color: "#b0b8c1",
    bg: "#f2f4f6",
  },
];

export interface PresenceSelectorProps {
  /** 현재 프레즌스 */
  value: Presence;
  /** 변경 콜백 */
  onChange: (value: Presence) => void;
  /** 상태 메시지 (선택) */
  statusMessage?: string;
  /** 상태 메시지 변경 콜백 */
  onStatusMessageChange?: (message: string) => void;
  /** 컴팩트 모드 (사이드바용 점 + 화살표) */
  compact?: boolean;
  className?: string;
}

export const PresenceSelector: React.FC<PresenceSelectorProps> = ({
  value,
  onChange,
  statusMessage,
  onStatusMessageChange,
  compact = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState(statusMessage ?? "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftMessage(statusMessage ?? "");
  }, [statusMessage]);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isOpen]);

  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  const handleSelect = (next: Presence) => {
    onChange(next);
    setIsOpen(false);
  };

  const handleMessageBlur = () => {
    if (draftMessage !== statusMessage) {
      onStatusMessageChange?.(draftMessage);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`
          inline-flex items-center gap-2 transition-all
          ${
            compact
              ? "rounded-full px-2 py-1 hover:bg-[var(--gray-100)]"
              : "h-10 rounded-[var(--r-md)] border border-[var(--gray-200)] bg-white px-3 hover:bg-[var(--gray-50)]"
          }
        `}
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            backgroundColor: current.color,
            boxShadow:
              current.value === "focus" ? `0 0 0 3px ${current.bg}` : "none",
          }}
        />
        {!compact && (
          <span className="text-[13px] font-semibold text-[var(--gray-800)]">
            {current.label}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-[var(--gray-400)] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="
            absolute right-0 top-full z-40 mt-2 w-[280px]
            rounded-[var(--r-md)] border border-[var(--gray-200)]
            bg-white shadow-[var(--shadow-lg)] overflow-hidden
            animate-in fade-in slide-in-from-top-1 duration-150
          "
        >
          <div className="p-1">
            {OPTIONS.map((opt) => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    flex w-full items-start gap-2.5 rounded-[var(--r-sm)]
                    p-2.5 text-left transition-colors
                    ${
                      isActive
                        ? "bg-[var(--brand-primary-light)]"
                        : "hover:bg-[var(--gray-50)]"
                    }
                  `}
                >
                  <span
                    className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[var(--gray-900)]">
                      {opt.label}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--gray-500)] leading-relaxed">
                      {opt.description}
                    </div>
                  </div>
                  {isActive && (
                    <Check
                      size={14}
                      className="mt-1 shrink-0 text-[var(--brand-primary)]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {onStatusMessageChange && (
            <div className="border-t border-[var(--gray-100)] p-3">
              <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
                <Edit3 size={10} />
                상태 메시지
              </div>
              <input
                value={draftMessage}
                maxLength={40}
                onChange={(e) => setDraftMessage(e.target.value)}
                onBlur={handleMessageBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleMessageBlur();
                    setIsOpen(false);
                  }
                }}
                placeholder="예) 회의 중이에요"
                className="
                  h-9 w-full rounded-[var(--r-sm)] bg-[var(--gray-50)]
                  px-2.5 text-[13px] outline-none
                  focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary-light)]
                  placeholder:text-[var(--gray-400)]
                "
              />
              <div className="mt-1 text-right text-[10px] text-[var(--gray-400)]">
                {draftMessage.length} / 40
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

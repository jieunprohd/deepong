"use client";

import React from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";

export type FocusPhase = "focus" | "short-break" | "long-break";

export interface FocusPreset {
  /** 프리셋 라벨 */
  label: string;
  /** 집중 길이 (분) */
  focus: number;
  /** 짧은 휴식 (분) */
  shortBreak: number;
  /** 긴 휴식 (분) */
  longBreak: number;
}

export const DEFAULT_PRESETS: FocusPreset[] = [
  { label: "클래식 25/5", focus: 25, shortBreak: 5, longBreak: 15 },
  { label: "딥워크 50/10", focus: 50, shortBreak: 10, longBreak: 20 },
  { label: "짧게 15/3", focus: 15, shortBreak: 3, longBreak: 10 },
];

export interface FocusTimerProps {
  /** 현재 단계 */
  phase: FocusPhase;
  /** 단계 변경 콜백 */
  onPhaseChange?: (phase: FocusPhase) => void;
  /** 남은 시간 (초) */
  remainingSeconds: number;
  /** 단계 전체 길이 (초) */
  totalSeconds: number;
  /** 실행 중인지 여부 */
  isRunning: boolean;
  /** 시작/일시정지 토글 */
  onToggle: () => void;
  /** 리셋 콜백 */
  onReset: () => void;
  /** 현재 사이클 인덱스 (1-based) */
  currentCycle?: number;
  /** 총 사이클 수 */
  totalCycles?: number;
  /** 프리셋 변경 (선택) */
  preset?: FocusPreset;
  presets?: FocusPreset[];
  onPresetChange?: (preset: FocusPreset) => void;
  className?: string;
}

const phaseInfo: Record<
  FocusPhase,
  { label: string; emoji: string; color: string; bg: string }
> = {
  focus: {
    label: "집중",
    emoji: "🔵",
    color: "var(--brand-primary)",
    bg: "var(--brand-primary-light)",
  },
  "short-break": {
    label: "짧은 휴식",
    emoji: "☕",
    color: "var(--success)",
    bg: "var(--success-light)",
  },
  "long-break": {
    label: "긴 휴식",
    emoji: "🌿",
    color: "var(--warning)",
    bg: "var(--warning-light)",
  },
};

function formatTime(seconds: number): string {
  const m = Math.max(0, Math.floor(seconds / 60));
  const s = Math.max(0, seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  phase,
  onPhaseChange,
  remainingSeconds,
  totalSeconds,
  isRunning,
  onToggle,
  onReset,
  currentCycle = 1,
  totalCycles = 4,
  preset,
  presets = DEFAULT_PRESETS,
  onPresetChange,
  className = "",
}) => {
  const info = phaseInfo[phase];
  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0;
  // SVG 원 둘레 계산 (반지름 80)
  const circumference = 2 * Math.PI * 80;
  const dashOffset = circumference * (1 - progress);

  // 페이즈 표시용 한 줄 라벨
  const phaseTabs: {
    value: FocusPhase;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "focus", label: "집중", icon: <Brain size={13} /> },
    { value: "short-break", label: "휴식", icon: <Coffee size={13} /> },
    { value: "long-break", label: "긴 휴식", icon: <Coffee size={13} /> },
  ];

  return (
    <div
      className={`
        rounded-[var(--r-xl)] border border-[var(--gray-200)] bg-white
        p-6 shadow-[var(--shadow-sm)]
        ${className}
      `}
    >
      {/* Phase tabs */}
      {onPhaseChange && (
        <div className="mb-5 flex justify-center gap-1">
          {phaseTabs.map((t) => (
            <button
              key={t.value}
              onClick={() => onPhaseChange(t.value)}
              className={`
                inline-flex items-center gap-1.5 rounded-full
                h-7 px-3 text-[11px] font-bold transition-all
                ${
                  phase === t.value
                    ? "bg-[var(--gray-900)] text-white"
                    : "text-[var(--gray-500)] hover:bg-[var(--gray-100)]"
                }
              `}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Circular progress */}
      <div className="relative mx-auto mb-4 flex h-[200px] w-[200px] items-center justify-center">
        <svg width={200} height={200} className="-rotate-90">
          <circle
            cx={100}
            cy={100}
            r={80}
            fill="none"
            stroke="var(--gray-100)"
            strokeWidth={10}
          />
          <circle
            cx={100}
            cy={100}
            r={80}
            fill="none"
            stroke={info.color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: info.bg, color: info.color }}
          >
            {info.emoji} {info.label}
          </span>
          <span className="mt-2 font-mono text-[40px] font-bold tracking-tight text-[var(--gray-900)] tabular-nums">
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-[11px] text-[var(--gray-500)]">
            사이클 {currentCycle} / {totalCycles}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onReset}
          className="
            inline-flex h-10 w-10 items-center justify-center rounded-full
            border border-[var(--gray-200)] bg-white text-[var(--gray-600)]
            transition-all hover:bg-[var(--gray-100)] active:scale-95
          "
          aria-label="리셋"
        >
          <RotateCcw size={16} strokeWidth={2.2} />
        </button>
        <button
          onClick={onToggle}
          className={`
            inline-flex h-12 w-12 items-center justify-center rounded-full
            text-white shadow-[var(--shadow-md)] transition-all
            active:scale-95
          `}
          style={{ backgroundColor: info.color }}
          aria-label={isRunning ? "일시정지" : "시작"}
        >
          {isRunning ? (
            <Pause size={20} strokeWidth={2.4} />
          ) : (
            <Play size={20} strokeWidth={2.4} className="ml-0.5" />
          )}
        </button>
        <div className="h-10 w-10" /> {/* spacer for symmetry */}
      </div>

      {/* Preset selector */}
      {onPresetChange && presets.length > 0 && (
        <div className="mt-5 border-t border-[var(--gray-100)] pt-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
            프리셋
          </div>
          <div className="flex gap-1.5">
            {presets.map((p) => {
              const isActive = preset?.label === p.label;
              return (
                <button
                  key={p.label}
                  onClick={() => onPresetChange(p)}
                  className={`
                    flex-1 rounded-[var(--r-sm)] px-2 py-1.5 text-[11px]
                    font-semibold transition-colors
                    ${
                      isActive
                        ? "bg-[var(--brand-primary-light)] text-[var(--brand-primary)]"
                        : "bg-[var(--gray-50)] text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                    }
                  `}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

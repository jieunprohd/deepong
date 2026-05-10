"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FocusTimer,
  FocusPhase,
  FocusPreset,
  DEFAULT_PRESETS,
} from "@/features/attention/FocusTimer";
import { Card } from "@/app/_components/Card";
import { Brain, Clock, Coffee, Leaf, Bell, Sparkles } from "lucide-react";

const minToSec = (m: number) => m * 60;

// ── 페이즈별 테마 (FocusTimer phaseInfo와 동일한 CSS 변수 사용) ────────────────

const PHASE_CONFIG = {
  focus: {
    label: "집중",
    color: "var(--brand-primary)",
    bg: "var(--brand-primary-light)",
    icon: <Brain size={20} strokeWidth={2.2} />,
    chipIcon: <Clock size={13} strokeWidth={2.4} />,
    statsTitle: "오늘 집중 통계",
    accumLabel: "오늘 집중",
  },
  "short-break": {
    label: "짧은 휴식",
    color: "var(--success)",
    bg: "var(--success-light)",
    icon: <Coffee size={20} strokeWidth={2.2} />,
    chipIcon: <Coffee size={13} strokeWidth={2.4} />,
    statsTitle: "오늘 휴식 통계",
    accumLabel: "오늘 휴식",
  },
  "long-break": {
    label: "긴 휴식",
    color: "var(--warning)",
    bg: "var(--warning-light)",
    icon: <Leaf size={20} strokeWidth={2.2} />,
    chipIcon: <Leaf size={13} strokeWidth={2.4} />,
    statsTitle: "오늘 긴 휴식 통계",
    accumLabel: "오늘 긴 휴식",
  },
} as const;

// ── localStorage ──────────────────────────────────────────────────────────────

const TIMER_KEY = "deepong-focus-timer";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function statKey() {
  return `deepong-focus-stats-${todayStr()}`;
}

interface TimerSnapshot {
  phase: FocusPhase;
  remainingByPhase: Record<FocusPhase, number>;
  cycle: number;
  presetLabel: string;
}

interface DayStats {
  completedFocusSec: number;
  completedCycles: number;
  completedShortBreaks: number;
  completedShortBreakSec: number;
  completedLongBreaks: number;
  completedLongBreakSec: number;
}

function defaultStats(): DayStats {
  return {
    completedFocusSec: 0,
    completedCycles: 0,
    completedShortBreaks: 0,
    completedShortBreakSec: 0,
    completedLongBreaks: 0,
    completedLongBreakSec: 0,
  };
}

function loadSnapshot(): TimerSnapshot | null {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? (JSON.parse(raw) as TimerSnapshot) : null;
  } catch {
    return null;
  }
}
function saveSnapshot(snap: TimerSnapshot) {
  try {
    localStorage.setItem(TIMER_KEY, JSON.stringify(snap));
  } catch {}
}
function loadStats(): DayStats {
  try {
    const raw = localStorage.getItem(statKey());
    if (!raw) return defaultStats();
    const p = JSON.parse(raw);
    return {
      completedFocusSec: p.completedFocusSec ?? 0,
      completedCycles: p.completedCycles ?? 0,
      completedShortBreaks: p.completedShortBreaks ?? 0,
      completedShortBreakSec: p.completedShortBreakSec ?? 0,
      completedLongBreaks: p.completedLongBreaks ?? 0,
      completedLongBreakSec: p.completedLongBreakSec ?? 0,
    };
  } catch {
    return defaultStats();
  }
}
function persistStats(s: DayStats) {
  try {
    localStorage.setItem(statKey(), JSON.stringify(s));
  } catch {}
}

// ── 포맷 유틸 ─────────────────────────────────────────────────────────────────

function formatAccum(sec: number): string {
  if (sec <= 0) return "0분";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}
function formatHM(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function initRemainingByPhase(pr: FocusPreset): Record<FocusPhase, number> {
  return {
    focus: minToSec(pr.focus),
    "short-break": minToSec(pr.shortBreak),
    "long-break": minToSec(pr.longBreak),
  };
}

function getStatsItems(
  phase: FocusPhase,
  stats: DayStats,
  displayFocusSec: number,
  displayShortBreakSec: number,
  displayLongBreakSec: number,
) {
  if (phase === "focus") {
    return [
      { label: "완료한 사이클", value: String(stats.completedCycles), unit: "회" },
      { label: "집중 시간", value: formatHM(displayFocusSec), unit: "h" },
      { label: "방해받음", value: "0", unit: "회" },
    ];
  }
  if (phase === "short-break") {
    return [
      { label: "짧은 휴식", value: String(stats.completedShortBreaks), unit: "회" },
      { label: "쉰 시간", value: formatHM(displayShortBreakSec), unit: "h" },
      { label: "완료한 사이클", value: String(stats.completedCycles), unit: "회" },
    ];
  }
  return [
    { label: "긴 휴식", value: String(stats.completedLongBreaks), unit: "회" },
    { label: "쉰 시간", value: formatHM(displayLongBreakSec), unit: "h" },
    { label: "완료한 사이클", value: String(stats.completedCycles), unit: "회" },
  ];
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function FocusPage() {
  const [ready, setReady] = useState(false);
  const [preset, setPreset] = useState<FocusPreset>(DEFAULT_PRESETS[0]);
  const [phase, setPhase] = useState<FocusPhase>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [remainingByPhase, setRemainingByPhase] = useState<Record<FocusPhase, number>>(
    initRemainingByPhase(DEFAULT_PRESETS[0]),
  );
  const [cycle, setCycle] = useState(1);
  const [stats, setStats] = useState<DayStats>(defaultStats());
  const [liveElapsedSec, setLiveElapsedSec] = useState(0);
  const [liveBreakSec, setLiveBreakSec] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveElapsedRef = useRef(0);
  const liveBreakRef = useRef(0);

  // ── 마운트 복원 ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const snap = loadSnapshot();
    const s = loadStats();
    setStats(s);

    if (snap) {
      const found =
        DEFAULT_PRESETS.find((p) => p.label === snap.presetLabel) ?? DEFAULT_PRESETS[0];
      setPreset(found);
      setPhase(snap.phase);
      if (snap.remainingByPhase && typeof snap.remainingByPhase === "object") {
        setRemainingByPhase(snap.remainingByPhase);
      } else {
        setRemainingByPhase(initRemainingByPhase(found));
      }
      setCycle(snap.cycle);
      setIsRunning(false);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── snapshot 저장 ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!ready) return;
    saveSnapshot({ phase, remainingByPhase, cycle, presetLabel: preset.label });
  }, [ready, phase, remainingByPhase, cycle, preset]);

  // ── flush 함수 ────────────────────────────────────────────────────────────────

  const flushElapsed = useCallback(() => {
    const elapsed = liveElapsedRef.current;
    liveElapsedRef.current = 0;
    setLiveElapsedSec(0);
    if (elapsed <= 0) return;
    setStats((prev) => {
      const next = { ...prev, completedFocusSec: prev.completedFocusSec + elapsed };
      persistStats(next);
      return next;
    });
  }, []);

  const flushBreakElapsed = useCallback((p: FocusPhase) => {
    const elapsed = liveBreakRef.current;
    liveBreakRef.current = 0;
    setLiveBreakSec(0);
    if (elapsed <= 0 || p === "focus") return;
    setStats((prev) => {
      const next =
        p === "short-break"
          ? { ...prev, completedShortBreakSec: prev.completedShortBreakSec + elapsed }
          : { ...prev, completedLongBreakSec: prev.completedLongBreakSec + elapsed };
      persistStats(next);
      return next;
    });
  }, []);

  // ── 타이머 인터벌 ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingByPhase((prev) => {
        const cur = prev[phase];

        if (cur <= 1) {
          if (phase === "focus") {
            const elapsed = liveElapsedRef.current;
            liveElapsedRef.current = 0;
            setLiveElapsedSec(0);
            setStats((s) => {
              const next = {
                ...s,
                completedFocusSec: s.completedFocusSec + elapsed,
                completedCycles: s.completedCycles + 1,
              };
              persistStats(next);
              return next;
            });
            const nextPhase: FocusPhase = cycle % 4 === 0 ? "long-break" : "short-break";
            setPhase(nextPhase);
            setIsRunning(false);
            return { ...prev, focus: minToSec(preset.focus) };
          } else {
            const elapsed = liveBreakRef.current;
            liveBreakRef.current = 0;
            setLiveBreakSec(0);
            setStats((s) => {
              const next =
                phase === "short-break"
                  ? {
                      ...s,
                      completedShortBreaks: s.completedShortBreaks + 1,
                      completedShortBreakSec: s.completedShortBreakSec + elapsed,
                    }
                  : {
                      ...s,
                      completedLongBreaks: s.completedLongBreaks + 1,
                      completedLongBreakSec: s.completedLongBreakSec + elapsed,
                    };
              persistStats(next);
              return next;
            });
            setPhase("focus");
            setCycle((c) => c + 1);
            setIsRunning(false);
            const resetSec =
              phase === "short-break"
                ? minToSec(preset.shortBreak)
                : minToSec(preset.longBreak);
            return { ...prev, [phase]: resetSec };
          }
        }

        if (phase === "focus") {
          liveElapsedRef.current += 1;
          setLiveElapsedSec(liveElapsedRef.current);
        } else {
          liveBreakRef.current += 1;
          setLiveBreakSec(liveBreakRef.current);
        }
        return { ...prev, [phase]: cur - 1 };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, phase, preset, cycle]);

  // ── 핸들러 ────────────────────────────────────────────────────────────────────

  const totalForPhase = (p: FocusPhase, pr: FocusPreset) => {
    if (p === "focus") return minToSec(pr.focus);
    if (p === "short-break") return minToSec(pr.shortBreak);
    return minToSec(pr.longBreak);
  };

  const handleToggle = () => {
    if (isRunning) {
      if (phase === "focus") flushElapsed();
      else flushBreakElapsed(phase);
    }
    setIsRunning((r) => !r);
  };

  const handlePhaseChange = (next: FocusPhase) => {
    if (isRunning) {
      if (phase === "focus") flushElapsed();
      else flushBreakElapsed(phase);
    }
    setIsRunning(false);
    setPhase(next);
  };

  const handlePresetChange = (next: FocusPreset) => {
    if (isRunning) {
      if (phase === "focus") flushElapsed();
      else flushBreakElapsed(phase);
    }
    setIsRunning(false);
    setPreset(next);
    setRemainingByPhase(initRemainingByPhase(next));
  };

  const handleReset = () => {
    if (isRunning) {
      if (phase === "focus") flushElapsed();
      else flushBreakElapsed(phase);
    }
    setIsRunning(false);
    setRemainingByPhase((prev) => ({ ...prev, [phase]: totalForPhase(phase, preset) }));
  };

  // ── 파생값 ────────────────────────────────────────────────────────────────────

  const cfg = PHASE_CONFIG[phase];
  const remaining = remainingByPhase[phase];
  const totalSec = totalForPhase(phase, preset);
  const progress = totalSec > 0 ? Math.round((1 - remaining / totalSec) * 100) : 0;

  const displayFocusSec =
    stats.completedFocusSec + (phase === "focus" ? liveElapsedSec : 0);
  const displayShortBreakSec =
    stats.completedShortBreakSec + (phase === "short-break" ? liveBreakSec : 0);
  const displayLongBreakSec =
    stats.completedLongBreakSec + (phase === "long-break" ? liveBreakSec : 0);

  const chipText =
    phase === "focus"
      ? formatAccum(displayFocusSec)
      : phase === "short-break"
      ? formatAccum(displayShortBreakSec)
      : formatAccum(displayLongBreakSec);

  const statsItems = getStatsItems(
    phase,
    stats,
    displayFocusSec,
    displayShortBreakSec,
    displayLongBreakSec,
  );

  const tips: { icon: React.ReactNode; title: string; desc: string }[] = [
    {
      icon: <Bell size={14} style={{ color: "var(--brand-primary)" }} />,
      title: "집중 모드에는 알림이 조용히 와요",
      desc: "수다·물어봄 메시지는 모아뒀다가 쉴 때 전해드려요. ⚡급함만 즉시 알림이 가요.",
    },
    {
      icon: <Coffee size={14} style={{ color: "var(--success)" }} />,
      title: "휴식 시간엔 진짜로 쉬세요",
      desc: "휴식이 끝나야 다음 사이클이 시작돼요. 잠깐 일어나서 스트레칭 한 번!",
    },
    {
      icon: <Sparkles size={14} style={{ color: "var(--warning)" }} />,
      title: "완료 후 따라잡기 피드 확인",
      desc: "사이클이 끝나면 홈에서 그동안 놓친 것들을 빠르게 따라잡을 수 있어요.",
    },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── 헤더 ────────────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-[#e5e8eb] bg-white px-8 pb-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-[22px] font-bold tracking-tight text-[#191f28]">
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
              {cfg.label} 모드
            </h1>
            <p className="mt-0.5 text-[13px] text-[#6b7684]">
              방해 없이 깊게 일하고, 끝나면 한 번에 따라잡기.
            </p>
          </div>
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {cfg.chipIcon}
            {cfg.accumLabel} {chipText}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#f9fafb] px-8 py-7">
        <div className="mx-auto grid w-full max-w-[920px] grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div>
            <FocusTimer
              phase={phase}
              onPhaseChange={handlePhaseChange}
              remainingSeconds={remaining}
              totalSeconds={totalSec}
              isRunning={isRunning}
              onToggle={handleToggle}
              onReset={handleReset}
              currentCycle={cycle}
              totalCycles={4}
              preset={preset}
              presets={DEFAULT_PRESETS}
              onPresetChange={handlePresetChange}
            />
          </div>

          <div className="flex flex-col gap-4">
            {/* 현재 사이클 진행률 */}
            <Card variant="outline" padding="md">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-[#191f28]">현재 사이클 진행률</h3>
                <span
                  className="ml-auto text-[12px] font-bold transition-colors"
                  style={{ color: cfg.color }}
                >
                  {progress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#f2f4f6]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: cfg.color }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#6b7684]">
                <span>사이클 {cycle} / 4</span>
                <span>{preset.label}</span>
              </div>
            </Card>

            {/* 오늘 통계 — 탭별 분기 */}
            <Card variant="outline" padding="md">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#191f28]">{cfg.statsTitle}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b95a1]">
                  {todayStr()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {statsItems.map((s, i) => (
                  <div key={i} className="rounded-lg bg-[#f9fafb] p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8b95a1]">
                      {s.label}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-[20px] font-bold tabular-nums text-[#191f28]">
                        {s.value}
                      </span>
                      <span className="text-[11px] text-[#6b7684]">{s.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 팁 */}
            <Card variant="outline" padding="md">
              <h3 className="mb-3 text-[14px] font-bold text-[#191f28]">집중 모드 팁</h3>
              <ul className="flex flex-col gap-2.5">
                {tips.map((tip, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#f2f4f6]">
                      {tip.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold text-[#191f28]">{tip.title}</div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#6b7684]">
                        {tip.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

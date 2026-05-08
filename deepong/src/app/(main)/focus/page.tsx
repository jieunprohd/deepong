"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  FocusTimer,
  FocusPhase,
  FocusPreset,
  DEFAULT_PRESETS,
} from "@/features/attention/FocusTimer";
import { Card } from "@/app/_components/Card";
import { Brain, Coffee, Clock, Bell, Sparkles } from "lucide-react";

const minToSec = (m: number) => m * 60;

export default function FocusPage() {
  const [preset, setPreset] = useState<FocusPreset>(DEFAULT_PRESETS[0]);
  const [phase, setPhase] = useState<FocusPhase>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [remaining, setRemaining] = useState(minToSec(preset.focus));
  const [cycle, setCycle] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalForPhase = (p: FocusPhase, pr: FocusPreset) => {
    if (p === "focus") return minToSec(pr.focus);
    if (p === "short-break") return minToSec(pr.shortBreak);
    return minToSec(pr.longBreak);
  };

  // 타이머 동작
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          // 단계 종료 — 다음 단계로
          if (phase === "focus") {
            const nextPhase: FocusPhase =
              cycle % 4 === 0 ? "long-break" : "short-break";
            setPhase(nextPhase);
            setIsRunning(false);
            return totalForPhase(nextPhase, preset);
          } else {
            setPhase("focus");
            setCycle((c) => c + 1);
            setIsRunning(false);
            return totalForPhase("focus", preset);
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, phase, preset, cycle]);

  // 프리셋 / 페이즈 바뀌면 시간 리셋
  const handlePhaseChange = (next: FocusPhase) => {
    setPhase(next);
    setRemaining(totalForPhase(next, preset));
    setIsRunning(false);
  };

  const handlePresetChange = (next: FocusPreset) => {
    setPreset(next);
    setRemaining(totalForPhase(phase, next));
    setIsRunning(false);
  };

  const handleReset = () => {
    setRemaining(totalForPhase(phase, preset));
    setIsRunning(false);
  };

  const tips: { icon: React.ReactNode; title: string; desc: string }[] = [
    {
      icon: <Bell size={14} className="text-[var(--brand-primary)]" />,
      title: "집중 모드에는 알림이 조용히 와요",
      desc: "수다·물어봄 메시지는 모아뒀다가 쉴 때 전해드려요. ⚡급함만 즉시 알림이 가요.",
    },
    {
      icon: <Coffee size={14} className="text-[var(--success)]" />,
      title: "휴식 시간엔 진짜로 쉬세요",
      desc: "휴식이 끝나야 다음 사이클이 시작돼요. 잠깐 일어나서 스트레칭 한 번!",
    },
    {
      icon: <Sparkles size={14} className="text-[var(--warning)]" />,
      title: "완료 후 따라잡기 피드 확인",
      desc: "사이클이 끝나면 홈에서 그동안 놓친 것들을 빠르게 따라잡을 수 있어요.",
    },
  ];

  const totalSec = totalForPhase(phase, preset);
  const progress =
    totalSec > 0 ? Math.round((1 - remaining / totalSec) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#e5e8eb] bg-white px-8 pb-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-[22px] font-bold tracking-tight text-[#191f28]">
              <Brain
                size={20}
                className="text-[var(--brand-primary)]"
                strokeWidth={2.2}
              />
              집중 모드
            </h1>
            <p className="mt-0.5 text-[13px] text-[#6b7684]">
              방해 없이 깊게 일하고, 끝나면 한 번에 따라잡기.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[var(--brand-primary-light)] px-3 py-1.5 text-[12px] font-bold text-[var(--brand-primary)]">
            <Clock size={13} strokeWidth={2.4} />
            오늘 누적 1시간 24분
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#f9fafb] px-8 py-7">
        <div className="mx-auto grid w-full max-w-[920px] grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Timer */}
          <div>
            <FocusTimer
              phase={phase}
              onPhaseChange={handlePhaseChange}
              remainingSeconds={remaining}
              totalSeconds={totalSec}
              isRunning={isRunning}
              onToggle={() => setIsRunning((r) => !r)}
              onReset={handleReset}
              currentCycle={cycle}
              totalCycles={4}
              preset={preset}
              presets={DEFAULT_PRESETS}
              onPresetChange={handlePresetChange}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <Card variant="outline" padding="md">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-[#191f28]">
                  현재 사이클 진행률
                </h3>
                <span className="ml-auto text-[12px] font-bold text-[var(--brand-primary)]">
                  {progress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--gray-100)]">
                <div
                  className="h-full rounded-full bg-[var(--brand-primary)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#6b7684]">
                <span>사이클 {cycle} / 4</span>
                <span>{preset.label}</span>
              </div>
            </Card>

            <Card variant="outline" padding="md">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#191f28]">
                  오늘 집중 통계
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b95a1]">
                  2026-05-08
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "완료한 사이클", value: "3", unit: "회" },
                  { label: "집중 시간", value: "1:24", unit: "h" },
                  { label: "방해받음", value: "0", unit: "회" },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg bg-[#f9fafb] p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8b95a1]">
                      {s.label}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-[20px] font-bold tabular-nums text-[#191f28]">
                        {s.value}
                      </span>
                      <span className="text-[11px] text-[#6b7684]">
                        {s.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="outline" padding="md">
              <h3 className="mb-3 text-[14px] font-bold text-[#191f28]">
                집중 모드 팁
              </h3>
              <ul className="flex flex-col gap-2.5">
                {tips.map((tip, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--gray-50)]">
                      {tip.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold text-[#191f28]">
                        {tip.title}
                      </div>
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

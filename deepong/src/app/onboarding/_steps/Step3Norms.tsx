"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Toggle } from "@/app/_components/Toggle";

interface Props {
  onComplete: () => void;
  onPrev: () => void;
}

type DefaultTone = "chat" | "ask" | "share";

const TONE_TABS: { value: DefaultTone; label: string }[] = [
  { value: "chat", label: "💬 수다" },
  { value: "ask", label: "🤔 물어봄" },
  { value: "share", label: "📎 공유" },
];

export function Step3Norms({ onComplete, onPrev }: Props) {
  const [shareWorktime, setShareWorktime] = useState(true);
  const [allowUrgent, setAllowUrgent] = useState(true);
  const [defaultTone, setDefaultTone] = useState<DefaultTone>("chat");
  const [shareRead, setShareRead] = useState(false);

  const handleComplete = () => {
    // 기본 규범은 localStorage에 저장 (백엔드는 친구별 개별 설정)
    try {
      localStorage.setItem(
        "deepong-default-norms",
        JSON.stringify({ shareWorktime, allowUrgent, defaultTone, shareRead }),
      );
    } catch {}
    onComplete();
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-[48px] py-[40px]">
        <p className="mb-2 text-[11px] font-bold tracking-widest text-[var(--brand-primary)]">
          STEP 3 / 3
        </p>
        <h1 className="mb-2 text-[22px] font-bold tracking-tight text-[#191f28]">
          기본 소통 규칙
        </h1>
        <p className="mb-6 text-[14px] leading-relaxed text-[#6b7684]">
          친구를 추가할 때마다 이 기본값이 적용돼요.
          <br />
          언제든 친구별로 따로 바꿀 수 있어요.
        </p>

        {/* 힌트 박스 */}
        <div className="mb-6 flex gap-3 rounded-xl bg-[#f0f4ff] px-4 py-3 text-[12px] leading-relaxed text-[#4e5968]">
          <Info size={15} className="mt-0.5 shrink-0 text-[var(--brand-primary)]" />
          <span>이 규칙은 내 기준이에요. 친구도 자신의 기준을 따로 설정할 수 있어요.</span>
        </div>

        {/* Rule cards */}
        <div className="flex flex-col gap-3">
          {/* 업무 시간 공유 */}
          <div className="rounded-xl border border-[#e5e8eb] px-5 py-4">
            <Toggle
              checked={shareWorktime}
              onChange={setShareWorktime}
              label="업무 시간 공유"
              description="서로의 바쁜 시간을 알려줘서 방해를 줄여요."
            />
          </div>

          {/* 급함 태그 허용 */}
          <div className="rounded-xl border border-[#e5e8eb] px-5 py-4">
            <Toggle
              checked={allowUrgent}
              onChange={setAllowUrgent}
              label='"급함" 태그 허용'
              description="집중 모드 중에도 알림을 받을 수 있는 태그예요. 하루 3회로 제한돼요."
            />
          </div>

          {/* 기본 메시지 톤 */}
          <div className="rounded-xl border border-[#e5e8eb] px-5 py-4">
            <div className="mb-4">
              <p className="text-[14px] font-semibold text-[#191f28]">기본 메시지 톤</p>
              <p className="mt-0.5 text-[12px] text-[#6b7684]">
                메시지 입력창에 자동으로 선택되는 태그예요.
              </p>
            </div>
            <div className="flex gap-1.5 rounded-lg bg-[#f2f4f6] p-1">
              {TONE_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setDefaultTone(t.value)}
                  className={`flex-1 rounded-md py-2 text-[12px] font-semibold transition-all ${
                    defaultTone === t.value
                      ? "bg-white text-[#191f28] shadow-sm"
                      : "text-[#6b7684] hover:text-[#191f28]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 읽음 표시 공유 */}
          <div className="rounded-xl border border-[#e5e8eb] px-5 py-4">
            <Toggle
              checked={shareRead}
              onChange={setShareRead}
              label="읽음 표시 공유"
              description='내가 읽었는지 친구에게 보여요. "읽씹" 스트레스가 있다면 끄세요.'
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 flex items-center gap-3 border-t border-[#f2f4f6] px-[48px] py-4">
        <button onClick={onPrev} className="h-11 rounded-xl px-4 text-[14px] font-medium text-[#6b7684] hover:bg-[#f2f4f6]">
          ← 이전
        </button>
        <button
          onClick={onComplete}
          className="h-11 flex-1 rounded-xl bg-[#f2f4f6] text-[14px] font-semibold text-[#4e5968] hover:bg-[#e8eaed]"
        >
          기본값 쓰기
        </button>
        <button
          onClick={handleComplete}
          className="h-11 flex-1 rounded-xl bg-[var(--brand-primary)] text-[14px] font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
        >
          저장하고 시작
        </button>
      </footer>
    </>
  );
}

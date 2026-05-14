"use client";

import React, { useState, useCallback } from "react";
import { Link2, Copy, Check, Search, UserCheck, CheckCircle2 } from "lucide-react";
import { Avatar } from "@/app/_components/Avatar";
import { createInvitation, searchUserByHandle, SearchUserError } from "@/features/invitation/api";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

type Tab = "invite" | "search";

// TODO : 목업: 받은 친구 요청 (아직 수락 API 없음)
const MOCK_PENDING = [
  { id: "pr1", nickname: "민수", handle: "minsu_dev", color: "amber" as const, method: "초대 링크" },
  { id: "pr2", nickname: "지은", handle: "jieun.design", color: "green" as const, method: "QR" },
];

export function Step2Friends({ onNext, onPrev }: Props) {
  const [tab, setTab] = useState<Tab>("invite");

  // 초대 링크 상태
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // 이메일/핸들 검색 상태
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{ nickname: string; handle: string; avatarUrl: string | null } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // 목업 pending — 수락하면 목록에서 제거하지 않고 accepted 상태로 표시
  const [pending] = useState(MOCK_PENDING);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await createInvitation({ singleUse: true, ttlSeconds: 86400 });
      setInviteUrl(res.inviteUrl);
    } catch {
      setGenError("링크 생성에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      const el = document.createElement("input");
      el.value = inviteUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteUrl]);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setSearchResult(null);
    setSearchError(null);
    try {
      const res = await searchUserByHandle(trimmed);
      setSearchResult(res.user);
    } catch (err) {
      if (err instanceof SearchUserError && err.code === "not-found") {
        setSearchError("사용자를 찾을 수 없어요.");
      } else {
        setSearchError("검색 중 오류가 발생했어요.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-[56px] py-[40px]">
        <p className="mb-2 text-[11px] font-bold tracking-widest text-[var(--brand-primary)]">
          STEP 2 / 3
        </p>
        <h1 className="mb-2 text-[24px] font-bold tracking-tight text-[#191f28]">친구 추가</h1>
        <p className="mb-7 text-[14px] text-[#6b7684]">
          디퐁은 상호 수락 기반이에요. 초대 링크를 보내거나 핸들로 상대를 찾아보세요.
        </p>

        {/* Tabs */}
        <div className="mb-7 flex gap-2 rounded-xl bg-[#f2f4f6] p-1">
          {[
            { key: "invite" as Tab, label: "초대 링크", icon: <Link2 size={13} /> },
            { key: "search" as Tab, label: "핸들 검색", icon: <Search size={13} /> },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold transition-all ${tab === t.key
                  ? "bg-white text-[#191f28] shadow-sm"
                  : "text-[#6b7684] hover:text-[#191f28]"
                }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* 초대 링크 탭 */}
        {tab === "invite" && (
          <div>
            <div className="mb-5 rounded-xl border border-[var(--brand-primary-light)] bg-[var(--brand-primary-subtle,#f0f4ff)] p-6">
              <p className="mb-3 text-[11px] font-bold tracking-widest text-[var(--brand-primary)]">
                내 초대 링크
              </p>
              {inviteUrl ? (
                <div className="flex gap-2">
                  <div className="flex flex-1 items-center overflow-hidden rounded-lg border border-[#e5e8eb] bg-white px-3 py-2.5 font-mono text-[12px] text-[#4e5968]">
                    <span className="truncate">{inviteUrl}</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)]"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "복사됨!" : "복사"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] disabled:opacity-50"
                >
                  <Link2 size={15} />
                  {isGenerating ? "생성 중..." : "초대 링크 만들기"}
                </button>
              )}
              {genError && (
                <p className="mt-2 text-[12px] text-[var(--danger)]">{genError}</p>
              )}
              {inviteUrl && (
                <div className="mt-3 flex gap-4 text-[12px] text-[#6b7684]">
                  <span className="flex items-center gap-1">
                    <span className="text-[var(--success)]">●</span> 24시간 유효
                  </span>
                  <span>🔒 1회용</span>
                </div>
              )}
            </div>

            {/* 받은 친구 요청 (목업) */}
            {pending.length > 0 && (
              <div>
                <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#8b95a1]">
                  받은 친구 요청 ({pending.length})
                </p>
                <div className="flex flex-col gap-1">
                  {pending.map((p) => {
                    const isAccepted = accepted.has(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${isAccepted ? "bg-[#f0faf4]" : "hover:bg-[#f9fafb]"}`}
                      >
                        <div className="relative">
                          <Avatar name={p.nickname} color={isAccepted ? "green" : p.color} size="md" hover={false} />
                          {isAccepted && (
                            <CheckCircle2
                              size={16}
                              className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white text-[var(--success)]"
                              strokeWidth={2.5}
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[14px] font-semibold text-[#191f28]">{p.nickname}</p>
                          <p className={`text-[12px] ${isAccepted ? "text-[var(--success)] font-medium" : "text-[#8b95a1]"}`}>
                            {isAccepted ? "친구가 됐어요!" : `@${p.handle} · ${p.method}로 요청`}
                          </p>
                        </div>
                        {isAccepted ? (
                          <div className="flex items-center gap-1.5 rounded-lg bg-[#e6f7ed] px-4 py-1.5 text-[13px] font-semibold text-[var(--success)]">
                            <Check size={13} strokeWidth={2.5} />
                            수락 됨
                          </div>
                        ) : (
                          <button
                            onClick={() => setAccepted((prev) => new Set([...prev, p.id]))}
                            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-[var(--brand-primary-hover)] active:scale-95 transition-transform"
                          >
                            <UserCheck size={13} />
                            수락
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 핸들 검색 탭 */}
        {tab === "search" && (
          <div>
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0b8c1]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="@핸들로 검색"
                className="h-12 w-full rounded-xl border border-[#e5e8eb] bg-white pl-10 pr-4 text-[14px] text-[#191f28] placeholder-[#b0b8c1] outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="mb-5 h-11 w-full rounded-xl bg-[var(--brand-primary)] text-[14px] font-semibold text-white hover:bg-[var(--brand-primary-hover)] disabled:opacity-50"
            >
              {isSearching ? "검색 중..." : "검색"}
            </button>

            {searchError && (
              <p className="text-[13px] text-[#8b95a1]">{searchError}</p>
            )}

            {searchResult && (
              <div className="flex items-center justify-between rounded-xl border border-[#e5e8eb] p-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={searchResult.nickname}
                    color="blue"
                    size="md"
                    profile={searchResult.avatarUrl ?? undefined}
                    hover={false}
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-[#191f28]">{searchResult.nickname}</p>
                    <p className="text-[12px] text-[#8b95a1]">@{searchResult.handle}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setTab("invite"); if (!inviteUrl) handleGenerate(); }}
                  className="rounded-lg border border-[var(--brand-primary)] px-4 py-1.5 text-[13px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]"
                >
                  초대 링크 보내기
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="shrink-0 flex items-center justify-between border-t border-[#f2f4f6] px-[56px] py-4">
        <button onClick={onPrev} className="h-11 rounded-xl px-4 text-[14px] font-medium text-[#6b7684] hover:bg-[#f2f4f6]">
          ← 이전
        </button>
        <button
          onClick={onNext}
          className="h-11 rounded-xl bg-[var(--brand-primary)] px-6 text-[14px] font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
        >
          다음으로
        </button>
      </footer>
    </>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { MOCK_LINKS, MOCK_REMINDERS, MockReminder } from "./_mock";
import Chip from "../_components/Chip";
import EmptyState from "../_components/EmptyState";
import { Card } from "../_components/Card";
import { CreateInvitationModal } from "@/features/invitation/CreateInvitationModal";
import {
  CatchupList,
  type CatchupItem,
  type CatchupItemType,
} from "@/features/catchup/CatchupList";
import { DigestSection } from "@/features/catchup/DigestSection";
import { ReminderCard } from "@/features/catchup/ReminderCard";
import {
  fetchCatchupFeed,
  recordCatchupAction,
  type CatchupFeedItem,
} from "@/features/catchup/api";
import { Bell, Link as LinkIcon } from "lucide-react";

function mapCatchupItem(f: CatchupFeedItem): CatchupItem {
  const type = f.tone.toLowerCase() as CatchupItemType;
  return {
    id: String(f.notificationId),
    type,
    author: { name: f.senderNickname ?? "알 수 없음" },
    time: formatRelative(f.createdAt),
    messages: f.content ? [{ text: f.content, tone: type }] : [],
    primaryActionLabel: "대화 열기",
    secondaryActionLabel: type === "ask" ? "읽음 처리" : undefined,
  };
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "어제";
  return `${days}일 전`;
}

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [reminders, setReminders] = useState<MockReminder[]>(MOCK_REMINDERS);
  const [feed, setFeed] = useState<CatchupFeedItem[]>([]);
  const [feedLoaded, setFeedLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCatchupFeed({ limit: 30 })
      .then((res) => {
        if (cancelled) return;
        setFeed(res.items);
      })
      .catch(() => {
        /* 빈 상태 유지 */
      })
      .finally(() => {
        if (!cancelled) setFeedLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const catchupItems = useMemo(() => feed.map(mapCatchupItem), [feed]);
  const hasConversations = !feedLoaded || catchupItems.length > 0;

  if (!hasConversations) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          variant="connect"
          fullScreen
          action={{
            label: "초대 링크 만들기",
            onClick: () => setIsInviteOpen(true),
          }}
          secondaryAction={{
            label: "친구 찾기",
            onClick: () => router.push("/friends"),
          }}
        />
        <CreateInvitationModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
        />
      </div>
    );
  }

  const askItems = catchupItems.filter(
    (c) => c.type === "ask" || c.type === "urgent",
  );
  const chatItems = catchupItems.filter((c) => c.type === "chat");
  const shareItems = catchupItems.filter((c) => c.type === "share");

  const activeReminders = reminders.filter((r) => !r.isCompleted);
  const completedReminders = reminders.filter((r) => r.isCompleted);

  const handlePrimaryAction = (id: string) => {
    const item = feed.find((f) => String(f.notificationId) === id);
    if (!item?.roomId) return;
    recordCatchupAction(item.messageId, "OPEN_CHAT").catch(() => {});
    router.push(`/chat/${item.roomId}`);
  };

  const handleSecondaryAction = (id: string) => {
    const item = feed.find((f) => String(f.notificationId) === id);
    if (!item) return;
    recordCatchupAction(item.messageId, "MARK_READ").catch(() => {});
    setFeed((prev) =>
      prev.filter((f) => f.notificationId !== item.notificationId),
    );
  };

  const handleReminderComplete = (id: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isCompleted: !r.isCompleted } : r,
      ),
    );
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Main Header */}
      <header className="shrink-0 border-b border-[#e5e8eb] bg-white px-8 pb-[18px] pt-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="mb-0.5 text-[22px] font-bold tracking-tight text-[#191f28]">
              안녕, {user?.nickname || "Oscar"} 👋
            </h1>
            <p className="text-[13px] text-[#6b7684]">
              집중 중이셨네요. 그동안 놓친 것들을 정리했어요.
            </p>
          </div>
          <Chip variant="status" presence="focus" statusValue="18" />
        </div>

        <div className="flex gap-3">
          {[
            {
              label: "답장 필요",
              value: String(askItems.length),
              unit: "건",
            },
            {
              label: "리마인더",
              value: String(activeReminders.length),
              unit: "건 진행 중",
            },
            {
              label: "공유받은 링크",
              value: String(MOCK_LINKS.length),
              unit: "개",
            },
          ].map((stat, i) => (
            <div key={i} className="flex-1 rounded-xl bg-[#f9fafb] p-[14px]">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#6b7684]">
                {stat.label}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[22px] font-bold tracking-tight text-[#191f28]">
                  {stat.value}
                </span>
                <span className="text-xs text-[#6b7684]">{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Feed Area */}
      <div className="flex-1 overflow-y-auto px-8 pb-10 pt-6">
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-7">
          {/* Reminders */}
          {(activeReminders.length > 0 || completedReminders.length > 0) && (
            <DigestSection
              title="오늘 챙길 것"
              meta={`${activeReminders.length}건 진행 중`}
              icon={<Bell size={14} />}
              accent="warning"
            >
              <div className="space-y-2">
                {activeReminders.map((r) => (
                  <ReminderCard
                    key={r.id}
                    type={r.type}
                    title={r.title}
                    description={r.description}
                    triggerAt={r.triggerAt}
                    relatedTo={r.relatedTo}
                    onComplete={() => handleReminderComplete(r.id)}
                    onSnooze={() => {}}
                  />
                ))}
                {completedReminders.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-[#8b95a1] hover:text-[#4e5968]">
                      완료한 항목 {completedReminders.length}개
                    </summary>
                    <div className="mt-2 space-y-2">
                      {completedReminders.map((r) => (
                        <ReminderCard
                          key={r.id}
                          type={r.type}
                          title={r.title}
                          description={r.description}
                          triggerAt={r.triggerAt}
                          relatedTo={r.relatedTo}
                          isCompleted
                          onComplete={() => handleReminderComplete(r.id)}
                        />
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </DigestSection>
          )}

          {/* Asks */}
          {askItems.length > 0 && (
            <DigestSection
              title="지금 신경 써야 할 것"
              description="답이 필요한 메시지"
              meta={`${askItems.length}건`}
              accent="brand"
            >
              <CatchupList
                items={askItems}
                onPrimaryAction={handlePrimaryAction}
                onSecondaryAction={handleSecondaryAction}
              />
            </DigestSection>
          )}

          {/* Chat (수다) */}
          {chatItems.length > 0 && (
            <DigestSection
              title="편하게 볼 것"
              description="급하지 않은 수다"
              meta={`${chatItems.length}건`}
              accent="neutral"
            >
              <CatchupList
                items={chatItems}
                onPrimaryAction={handlePrimaryAction}
                onSecondaryAction={handleSecondaryAction}
              />
            </DigestSection>
          )}

          {/* Shared links */}
          {(shareItems.length > 0 || MOCK_LINKS.length > 0) && (
            <DigestSection
              title="공유받은 것"
              description="천천히 읽어봐도 좋은 링크"
              meta={`${MOCK_LINKS.length}개`}
              icon={<LinkIcon size={14} />}
              accent="info"
            >
              {shareItems.length > 0 && (
                <CatchupList
                  items={shareItems}
                  onPrimaryAction={handlePrimaryAction}
                  onSecondaryAction={handleSecondaryAction}
                />
              )}
              <Card
                variant="outline"
                padding="none"
                className="transition-all hover:border-[#2f6bff] hover:shadow-sm"
              >
                <div className="grid grid-cols-2 gap-2 p-4">
                  {MOCK_LINKS.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#f9fafb] p-2 text-left transition-colors hover:bg-[#f2f4f6]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e5e8eb] text-[11px]">
                        {link.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-bold text-[#191f28]">
                          {link.title}
                        </div>
                        <div className="truncate text-[11px] text-[#8b95a1]">
                          {link.author} · {link.time}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </DigestSection>
          )}

          {askItems.length === 0 &&
            chatItems.length === 0 &&
            shareItems.length === 0 && (
              <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-[#e5e8eb] bg-white">
                <EmptyState
                  variant="celebrate"
                  title="다 따라잡았어요!"
                  description="새로 도착한 게 없어요. 잠시 한숨 돌려도 좋아요."
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

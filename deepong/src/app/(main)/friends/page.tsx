"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/app/_components/Avatar";
import { Button } from "@/app/_components/Button";
import EmptyState from "@/app/_components/EmptyState";
import { CreateInvitationModal } from "@/features/invitation/CreateInvitationModal";
import { fetchFriends } from "@/features/invitation/api";
import type { FriendItem } from "@/features/invitation/types";
import { UserPlus } from "lucide-react";

export default function FriendsPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const loadFriends = useCallback(async (cursor?: string) => {
    try {
      setError(false);
      const res = await fetchFriends(cursor);
      if (cursor) {
        setFriends((prev) => [...prev, ...res.items]);
      } else {
        setFriends(res.items);
      }
      setHasNext(res.hasNext);
      setNextCursor(res.nextCursor);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2f6bff] border-t-transparent" />
          <p className="text-sm text-[#8b95a1] font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-[#8b95a1] font-medium">
            친구 목록을 불러오지 못했습니다.
          </p>
          <Button variant="ghost" size="sm" onClick={() => loadFriends()}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          variant="connect"
          fullScreen
          action={{
            label: "친구 초대하기",
            onClick: () => setIsInviteOpen(true),
          }}
        />
        <CreateInvitationModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-[#e5e8eb] bg-white px-8 pb-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#191f28]">
              친구
            </h1>
            <p className="mt-0.5 text-[13px] text-[#6b7684]">
              {friends.length}명의 친구
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            leftIcon={<UserPlus size={15} />}
          >
            친구 초대
          </Button>
        </div>
      </header>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-1">
          {friends.map((friend) => (
            <Avatar
              key={friend.id}
              name={friend.peer.nickname}
              color="blue"
              profile={friend.peer.avatarUrl ?? undefined}
              subLabel={
                <span className="text-[12px] text-[#8b95a1]">
                  @{friend.peer.handle}
                </span>
              }
              lastMessage=" "
            />
          ))}
        </div>

        {hasNext && (
          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (nextCursor) loadFriends(nextCursor);
              }}
            >
              더 보기
            </Button>
          </div>
        )}
      </div>

      <CreateInvitationModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </div>
  );
}

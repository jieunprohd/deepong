"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/app/_components/Avatar";
import { Button } from "@/app/_components/Button";
import { Modal } from "@/app/_components/Modal";
import EmptyState from "@/app/_components/EmptyState";
import { CreateInvitationModal } from "@/features/invitation/CreateInvitationModal";
import {
  fetchFriends,
  searchUserByHandle,
  deleteFriendship,
  SearchUserError,
} from "@/features/invitation/api";
import type {
  FriendItem,
  SearchUserResponse,
} from "@/features/invitation/types";
import {
  CommunicationNormModal,
  CommunicationNorm,
} from "@/features/relationship/CommunicationNormModal";
import { useChat } from "@/lib/chat";
import { DEFAULT_NORM, MOCK_NORMS } from "../_mock";
import {
  UserPlus,
  Search,
  X,
  Bell,
  Star,
  Ban,
  MessageSquare,
} from "lucide-react";

export default function FriendsPage() {
  const router = useRouter();
  const { createRoom } = useChat();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [startingChatWith, setStartingChatWith] = useState<number | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchUserResponse | null>(
    null,
  );
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<FriendItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Communication Norm state
  const [normTarget, setNormTarget] = useState<FriendItem | null>(null);
  const [norms, setNorms] =
    useState<Record<string, CommunicationNorm>>(MOCK_NORMS);

  const getNormFor = (friendId: number): CommunicationNorm => {
    return norms[`f${friendId}`] ?? norms[String(friendId)] ?? DEFAULT_NORM;
  };

  const handleNormSave = (friend: FriendItem, norm: CommunicationNorm) => {
    setNorms((prev) => ({ ...prev, [`f${friend.id}`]: norm }));
    setNormTarget(null);
  };

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFriends();
  }, [loadFriends]);

  const handleSearch = useCallback(async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchResult(null);
    setSearchError(null);

    try {
      const res = await searchUserByHandle(trimmed);
      setSearchResult(res);
    } catch (err) {
      if (err instanceof SearchUserError && err.code === "not-found") {
        setSearchError("사용자를 찾을 수 없습니다.");
      } else {
        setSearchError("검색 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResult(null);
    setSearchError(null);
  };

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteFriendship(deleteTarget.id);
      setFriends((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // keep modal open on error
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget]);

  const handleStartChat = useCallback(
    async (friend: FriendItem) => {
      if (startingChatWith !== null) return;
      setStartingChatWith(friend.peer.id);
      try {
        const room = await createRoom("DIRECT", [friend.peer.id]);
        if (room) router.push(`/chat/${room.id}`);
      } finally {
        setStartingChatWith(null);
      }
    },
    [createRoom, router, startingChatWith],
  );

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

      {/* Search Bar */}
      <div className="shrink-0 border-b border-[#e5e8eb] bg-white px-8 py-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b95a1]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="핸들로 사용자 검색"
            className="w-full rounded-lg border border-[#e5e8eb] bg-[#f9fafb] py-2 pl-9 pr-9 text-sm text-[#191f28] placeholder-[#8b95a1] outline-none transition-colors focus:border-[#2f6bff] focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b95a1] hover:text-[#4e5968]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Result */}
        {isSearching && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2f6bff] border-t-transparent" />
            <span className="text-[13px] text-[#8b95a1]">검색 중...</span>
          </div>
        )}

        {searchError && (
          <p className="mt-3 text-[13px] text-[#8b95a1]">{searchError}</p>
        )}

        {searchResult && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-[#e5e8eb] bg-white p-3">
            <div className="flex items-center gap-2.5">
              <Avatar
                name={searchResult.user.nickname}
                color="blue"
                size="sm"
                profile={searchResult.user.avatarUrl ?? undefined}
                hover={false}
              />
              <div>
                <p className="text-sm font-semibold text-[#191f28]">
                  {searchResult.user.nickname}
                </p>
                <p className="text-[12px] text-[#8b95a1]">
                  @{searchResult.user.handle}
                </p>
              </div>
            </div>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                setIsInviteOpen(true);
              }}
              leftIcon={<UserPlus size={14} />}
            >
              초대 링크 보내기
            </Button>
          </div>
        )}
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-1">
          {friends.map((friend) => {
            const norm = getNormFor(friend.id);
            return (
              <div key={friend.id} className="group relative">
                <Avatar
                  name={friend.peer.nickname}
                  color="blue"
                  profile={friend.peer.avatarUrl ?? undefined}
                  subLabel={
                    <span className="flex items-center gap-1.5 text-[12px] text-[#8b95a1]">
                      @{friend.peer.handle}
                      {norm.isPriority && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-[var(--warning-light)] px-1.5 py-0.5 text-[10px] font-bold text-[#b06b00]">
                          <Star size={9} strokeWidth={2.5} />
                          우선
                        </span>
                      )}
                      {norm.isBlocked && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-[var(--danger-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--danger)]">
                          <Ban size={9} strokeWidth={2.5} />
                          차단
                        </span>
                      )}
                    </span>
                  }
                  lastMessage=" "
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
                  <button
                    onClick={() => handleStartChat(friend)}
                    disabled={startingChatWith === friend.peer.id}
                    className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-[#2f6bff] transition-all hover:bg-[#eaf0ff] disabled:opacity-50"
                    title="대화 시작"
                  >
                    <MessageSquare size={13} strokeWidth={2.2} />
                    {startingChatWith === friend.peer.id
                      ? "이동 중..."
                      : "대화"}
                  </button>
                  <button
                    onClick={() => setNormTarget(friend)}
                    className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-[#6b7684] transition-all hover:bg-[#f2f4f6] hover:text-[#191f28]"
                    title="알림 규범"
                  >
                    <Bell size={13} strokeWidth={2.2} />
                    알림 규범
                  </button>
                  <button
                    onClick={() => setDeleteTarget(friend)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#b0b8c1] transition-all hover:bg-[#f4f4f5] hover:text-[#f04452]"
                    title="친구 삭제"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
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

      {/* Communication Norm Modal */}
      {normTarget && (
        <CommunicationNormModal
          isOpen={!!normTarget}
          onClose={() => setNormTarget(null)}
          peer={{
            id: String(normTarget.id),
            nickname: normTarget.peer.nickname,
            handle: normTarget.peer.handle,
            avatarUrl: normTarget.peer.avatarUrl ?? undefined,
            color: "blue",
          }}
          initialNorm={getNormFor(normTarget.id)}
          onSave={(norm) => handleNormSave(normTarget, norm)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="친구 삭제"
      >
        <div className="flex flex-col gap-5">
          <p className="text-[13px] text-[var(--gray-600)] leading-relaxed">
            <strong>{deleteTarget?.peer.nickname}</strong> 님을 친구 목록에서
            삭제하시겠습니까?
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => setDeleteTarget(null)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

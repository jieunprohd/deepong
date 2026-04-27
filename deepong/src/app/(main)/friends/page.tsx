"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import type { FriendItem, SearchUserResponse } from "@/features/invitation/types";
import { UserPlus, Search, X } from "lucide-react";

export default function FriendsPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState(false);

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
          {friends.map((friend) => (
            <div key={friend.id} className="group relative">
              <Avatar
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
              <button
                onClick={() => setDeleteTarget(friend)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-[#b0b8c1] opacity-0 transition-all hover:bg-[#f4f4f5] hover:text-[#f04452] group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
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

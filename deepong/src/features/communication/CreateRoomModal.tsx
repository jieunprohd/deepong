"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/app/_components/Modal";
import { Button } from "@/app/_components/Button";
import { Avatar } from "@/app/_components/Avatar";
import { fetchFriends } from "@/features/invitation/api";
import type { FriendItem } from "@/features/invitation/types";
import { useChat } from "@/lib/chat";
import { Search, X, Check } from "lucide-react";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const { createRoom } = useChat();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFriends()
      .then((res) => {
        if (cancelled) return;
        setFriends(res.items);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFriends = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        f.peer.nickname.toLowerCase().includes(q) ||
        f.peer.handle.toLowerCase().includes(q),
    );
  }, [friends, query]);

  const toggle = useCallback((peerId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(peerId)) next.delete(peerId);
      else next.add(peerId);
      return next;
    });
  }, []);

  const selectedCount = selectedIds.size;
  const isGroup = selectedCount >= 2;
  const canSubmit = selectedCount >= 1 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const memberIds = Array.from(selectedIds);
      const type = isGroup ? "GROUP" : "DIRECT";
      const name = isGroup ? groupName.trim() || undefined : undefined;
      const room = await createRoom(type, memberIds, name);
      if (!room) {
        setSubmitError("대화방 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }
      onClose();
      router.push(`/chat/${room.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 대화 시작">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b95a1]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="친구 이름 또는 핸들 검색"
            className="w-full rounded-lg border border-[#e5e8eb] bg-[#f9fafb] py-2 pl-9 pr-9 text-sm text-[#191f28] placeholder-[#8b95a1] outline-none transition-colors focus:border-[#2f6bff] focus:bg-white"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b95a1] hover:text-[#4e5968]"
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Friends list */}
        <div className="max-h-[320px] overflow-y-auto -mx-1 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2f6bff] border-t-transparent" />
            </div>
          ) : error ? (
            <p className="py-12 text-center text-sm text-[#8b95a1]">
              친구 목록을 불러오지 못했어요.
            </p>
          ) : filteredFriends.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#8b95a1]">
              {query
                ? "검색 결과가 없어요."
                : "초대 가능한 친구가 없어요. 먼저 친구를 추가해주세요."}
            </p>
          ) : (
            <ul className="flex flex-col">
              {filteredFriends.map((friend) => {
                const checked = selectedIds.has(friend.peer.id);
                return (
                  <li key={friend.id}>
                    <button
                      type="button"
                      onClick={() => toggle(friend.peer.id)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#f2f4f6]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={friend.peer.nickname}
                          profile={friend.peer.avatarUrl ?? undefined}
                          color="blue"
                          size="sm"
                          hover={false}
                          className="p-0"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#191f28]">
                            {friend.peer.nickname}
                          </span>
                          <span className="text-[12px] text-[#8b95a1]">
                            @{friend.peer.handle}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                          checked
                            ? "border-[#2f6bff] bg-[#2f6bff] text-white"
                            : "border-[#d1d6db] bg-white"
                        }`}
                      >
                        {checked && <Check size={13} strokeWidth={3} />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Group name (only for 2+) */}
        {isGroup && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#4e5968]">
              그룹 이름 (선택)
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="비워두면 멤버 이름으로 표시돼요"
              className="w-full rounded-lg border border-[#e5e8eb] bg-[#f9fafb] px-3 py-2 text-sm text-[#191f28] placeholder-[#8b95a1] outline-none transition-colors focus:border-[#2f6bff] focus:bg-white"
              maxLength={50}
            />
          </div>
        )}

        {submitError && (
          <p className="text-[13px] text-[var(--danger)]">{submitError}</p>
        )}

        {/* Footer */}
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" size="sm" fullWidth onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={handleSubmit}
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            {isGroup
              ? `${selectedCount}명과 그룹 만들기`
              : selectedCount === 1
                ? "1:1 대화 시작"
                : "친구 선택"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/app/_components/Modal";
import { Button } from "@/app/_components/Button";
import { Avatar } from "@/app/_components/Avatar";
import { fetchFriends } from "@/features/invitation/api";
import type { FriendItem } from "@/features/invitation/types";
import { useChat, type RoomDto } from "@/lib/chat";
import { LogOut, UserPlus, Check, X } from "lucide-react";

interface RoomManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomDto;
}

type Mode = "info" | "add-members";

export function RoomManageModal({
  isOpen,
  onClose,
  room,
}: RoomManageModalProps) {
  const router = useRouter();
  const { updateRoom, addRoomMembers, leaveRoom } = useChat();
  const [mode, setMode] = useState<Mode>("info");
  const [name, setName] = useState(room.name ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const isGroup = room.type === "GROUP";

  useEffect(() => {
    if (mode !== "add-members") return;
    let cancelled = false;
    fetchFriends()
      .then((res) => {
        if (cancelled) return;
        setFriends(res.items);
      })
      .catch(() => {
        if (cancelled) return;
        setFriendsError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setIsFriendsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const existingMemberIds = useMemo(
    () => new Set(room.members.map((m) => Number(m.userId))),
    [room.members],
  );
  const candidates = useMemo(
    () => friends.filter((f) => !existingMemberIds.has(f.peer.id)),
    [friends, existingMemberIds],
  );

  const toggleCandidate = useCallback((peerId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(peerId)) next.delete(peerId);
      else next.add(peerId);
      return next;
    });
  }, []);

  const handleRename = async () => {
    const trimmed = name.trim();
    if (trimmed === (room.name ?? "")) return;
    setIsSavingName(true);
    setNameError(null);
    try {
      const updated = await updateRoom(room.id, trimmed);
      if (!updated) setNameError("이름을 변경하지 못했어요.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("정말 이 방을 나가시겠어요?")) return;
    setIsLeaving(true);
    const ok = await leaveRoom(room.id);
    setIsLeaving(false);
    if (ok) {
      onClose();
      router.push("/chat");
    }
  };

  const handleAddMembers = async () => {
    if (selectedIds.size === 0) return;
    setIsAdding(true);
    setAddError(null);
    try {
      const updated = await addRoomMembers(room.id, Array.from(selectedIds));
      if (!updated) {
        setAddError("멤버를 추가하지 못했어요.");
        return;
      }
      setMode("info");
      setSelectedIds(new Set());
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "add-members" ? "멤버 추가" : "대화방 정보"}
    >
      {mode === "info" ? (
        <div className="flex flex-col gap-5">
          {/* 이름 */}
          {isGroup ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#4e5968]">
                그룹 이름
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="비워두면 멤버 이름으로 표시"
                  maxLength={50}
                  className="flex-1 rounded-lg border border-[#e5e8eb] bg-[#f9fafb] px-3 py-2 text-sm outline-none focus:border-[#2f6bff] focus:bg-white"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRename}
                  disabled={
                    isSavingName || name.trim() === (room.name ?? "").trim()
                  }
                  isLoading={isSavingName}
                >
                  저장
                </Button>
              </div>
              {nameError && (
                <p className="text-[12px] text-[var(--danger)]">{nameError}</p>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-[#6b7684]">1:1 대화방입니다.</p>
          )}

          {/* 멤버 목록 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#4e5968]">
                멤버 {room.members.length}명
              </span>
              {isGroup && (
                <button
                  onClick={() => setMode("add-members")}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-[#2f6bff] hover:bg-[#eaf0ff]"
                  type="button"
                >
                  <UserPlus size={13} strokeWidth={2.2} />
                  멤버 추가
                </button>
              )}
            </div>
            <ul className="flex flex-col">
              {room.members.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center gap-2.5 px-1 py-1.5"
                >
                  <Avatar
                    name={m.nickname}
                    profile={m.avatarUrl ?? undefined}
                    color="blue"
                    size="sm"
                    hover={false}
                    className="p-0"
                  />
                  <span className="text-sm text-[#191f28]">{m.nickname}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 나가기 */}
          {isGroup && (
            <div className="border-t border-[#e5e8eb] pt-4">
              <Button
                variant="danger"
                size="sm"
                fullWidth
                onClick={handleLeave}
                isLoading={isLeaving}
                leftIcon={<LogOut size={14} />}
              >
                방 나가기
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="max-h-[320px] overflow-y-auto -mx-1 px-1">
            {isFriendsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2f6bff] border-t-transparent" />
              </div>
            ) : friendsError ? (
              <p className="py-12 text-center text-sm text-[#8b95a1]">
                친구 목록을 불러오지 못했어요.
              </p>
            ) : candidates.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#8b95a1]">
                추가할 수 있는 친구가 없어요.
              </p>
            ) : (
              <ul className="flex flex-col">
                {candidates.map((friend) => {
                  const checked = selectedIds.has(friend.peer.id);
                  return (
                    <li key={friend.id}>
                      <button
                        type="button"
                        onClick={() => toggleCandidate(friend.peer.id)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-[#f2f4f6]"
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
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
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

          {addError && (
            <p className="text-[13px] text-[var(--danger)]">{addError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => {
                setMode("info");
                setSelectedIds(new Set());
                setAddError(null);
              }}
              leftIcon={<X size={14} />}
            >
              뒤로
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleAddMembers}
              disabled={selectedIds.size === 0 || isAdding}
              isLoading={isAdding}
            >
              {selectedIds.size > 0
                ? `${selectedIds.size}명 추가`
                : "친구 선택"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

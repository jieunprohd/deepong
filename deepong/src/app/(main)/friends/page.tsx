"use client";

import React, { useState } from "react";
import { MOCK_FRIENDS } from "../_mock";
import { Avatar } from "@/app/_components/Avatar";
import { Button } from "@/app/_components/Button";
import EmptyState from "@/app/_components/EmptyState";
import { CreateInvitationModal } from "@/features/invitation/CreateInvitationModal";
import { UserPlus } from "lucide-react";

export default function FriendsPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const hasFriends = MOCK_FRIENDS.length > 0;

  if (!hasFriends) {
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
              {MOCK_FRIENDS.length}명의 친구
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
          {MOCK_FRIENDS.map((friend) => (
            <Avatar
              key={friend.id}
              name={friend.name}
              color={friend.color}
              presence={friend.presence}
              profile={friend.avatarUrl}
              subLabel={
                <span className="text-[12px] text-[#8b95a1]">
                  @{friend.handle}
                </span>
              }
              lastMessage=" "
            />
          ))}
        </div>
      </div>

      <CreateInvitationModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </div>
  );
}

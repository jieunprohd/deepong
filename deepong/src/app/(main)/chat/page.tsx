"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/lib/chat";
import EmptyState from "../../_components/EmptyState";

export default function ChatIndexPage() {
  const router = useRouter();
  const { rooms, isLoading } = useChat();

  useEffect(() => {
    if (!isLoading && rooms.length > 0) {
      router.replace(`/chat/${rooms[0].id}`);
    }
  }, [isLoading, rooms, router]);

  return (
    <div className="flex h-full items-center justify-center bg-white">
      <EmptyState
        variant="connect"
        fullScreen
        title="대화를 시작해보세요"
        description="왼쪽 목록에서 대화할 친구를 선택해주세요."
      />
    </div>
  );
}

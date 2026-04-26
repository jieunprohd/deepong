"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MOCK_CHATS } from "../_mock";
import EmptyState from "../../_components/EmptyState";

export default function ChatIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // 첫 번째 대화가 있으면 그리로 리다이렉트
    if (MOCK_CHATS.length > 0) {
      router.replace(`/chat/${MOCK_CHATS[0].id}`);
    }
  }, [router]);

  // 리다이렉트 전이나 대화가 아예 없을 때 표시
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

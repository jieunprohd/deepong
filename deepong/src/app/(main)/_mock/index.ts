import type { ReminderType } from "@/features/catchup/ReminderCard";

export interface LinkItem {
  id: string;
  chatId: string;
  title: string;
  icon: string;
  author: string;
  time: string;
}

export const MOCK_LINKS: LinkItem[] = [
  {
    id: "l1",
    chatId: "4",
    title: "DHH on Anti-AI Bias",
    icon: "📰",
    author: "준호",
    time: "2일 전",
  },
  {
    id: "l2",
    chatId: "2",
    title: "유튜브: 스타트업 펀딩",
    icon: "🎬",
    author: "지은",
    time: "2일 전",
  },
  {
    id: "l3",
    chatId: "3",
    title: "Notion 퍼블릭 문서",
    icon: "📄",
    author: "대학 동기방",
    time: "어제",
  },
  {
    id: "l4",
    chatId: "1",
    title: "강남역 카페 추천 스샷",
    icon: "📷",
    author: "서연",
    time: "어제",
  },
];

/* ─────────────────────────────────────────────────────────
 *  Reminders (홈 화면 상단)
 * ───────────────────────────────────────────────────────── */
export interface MockReminder {
  id: string;
  type: ReminderType;
  title: string;
  description?: string;
  triggerAt: string;
  relatedTo?: string;
  isCompleted?: boolean;
}

export const MOCK_REMINDERS: MockReminder[] = [
  {
    id: "r1",
    type: "reply",
    title: "민수에게 저녁 약속 답장",
    description: "강남 vs 성수, 시간은 8시 이후로 가능",
    triggerAt: "오늘 18:00",
    relatedTo: "민수",
  },
  {
    id: "r2",
    type: "schedule",
    title: "대학 동기방 모임 장소 정하기",
    description: "2명이 답했어요. 마감은 내일 정오",
    triggerAt: "내일 12:00",
    relatedTo: "대학 동기방",
  },
  {
    id: "r3",
    type: "followup",
    title: "준호가 공유한 글 읽고 답하기",
    triggerAt: "이번 주 안",
    relatedTo: "준호",
  },
  {
    id: "r4",
    type: "reply",
    title: "지은과 회의 후 톡하기",
    triggerAt: "오늘 17:00",
    relatedTo: "지은",
    isCompleted: true,
  },
];

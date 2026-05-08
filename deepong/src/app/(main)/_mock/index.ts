import { ToneType } from "@/app/_components/Chip/types";
import { AvatarColor } from "@/app/_components/Avatar";
import type {
  NotificationItem,
  NotificationDelivery,
  NotificationTone,
} from "@/features/attention/NotificationCenter";
import type { CatchupItem } from "@/features/catchup/CatchupList";
import type { ReminderType } from "@/features/catchup/ReminderCard";
import type { CommunicationNorm } from "@/features/relationship/CommunicationNormModal";
import type { HandRaiseUser } from "@/features/communication/HandRaisePanel";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderColor?: AvatarColor;
  text: string;
  time: string;
  tone?: ToneType;
  isMine: boolean;
  isRead?: boolean;
  /** 메시지에 손들기 패널을 띄울지 (그룹 ASK용) */
  raisedBy?: HandRaiseUser[];
}

export interface ChatItem {
  id: string;
  name: string;
  color: AvatarColor;
  presence: "free" | "working" | "focus" | "off";
  time: string;
  unreadCounts?: {
    ask?: number;
    chat?: number;
    share?: number;
    urgent?: number;
  };
  lastMessage?: string;
  isActive?: boolean;
  messages?: ChatMessage[];
  statusMessage?: string;
  /** 그룹방 여부 (HandRaisePanel은 그룹방의 ASK에서만 표시) */
  isGroup?: boolean;
  /** 그룹 멤버 수 */
  memberCount?: number;
}

export interface FeedItem {
  id: string;
  chatId: string;
  type: "ask" | "chat" | "share";
  author: {
    name: string;
    color: AvatarColor;
  };
  time: string;
  meta?: string;
  messages?: {
    text: string;
    time?: string;
    tone?: ToneType;
  }[];
}

export interface LinkItem {
  id: string;
  chatId: string;
  title: string;
  icon: string;
  author: string;
  time: string;
}

export const MOCK_CHATS: ChatItem[] = [
  {
    id: "1",
    name: "민수",
    color: "amber",
    presence: "working",
    time: "오전 9:24",
    unreadCounts: { ask: 2, chat: 4 },
    statusMessage: "🟡 일하는 중 · 오후 6:30까지",
    messages: [
      {
        id: "m1",
        senderId: "1",
        text: "혹시 오늘 저녁 약속 가능해? 지은이랑 같이 보려고",
        time: "08:44",
        tone: "ask",
        isMine: false,
      },
      {
        id: "m2",
        senderId: "1",
        text: "장소는 강남이나 성수 둘 중에 골라줘",
        time: "08:44",
        tone: "ask",
        isMine: false,
      },
      {
        id: "m3",
        senderId: "me",
        text: "어 오늘은 좀 늦어질 듯 ㅜ 8시 이후 가능하면 좋겠어",
        time: "09:12",
        tone: "chat",
        isMine: true,
        isRead: true,
      },
      {
        id: "m4",
        senderId: "1",
        text: "오케 성수에서 8시 반으로 할게!",
        time: "09:24",
        isMine: false,
      },
    ],
  },
  {
    id: "2",
    name: "지은",
    color: "green",
    presence: "free",
    time: "어제",
    lastMessage: "회의 끝나고 톡할게!",
    messages: [],
  },
  {
    id: "3",
    name: "대학 동기방",
    color: "gray",
    presence: "free",
    time: "어제",
    unreadCounts: { share: 7, ask: 1 },
    lastMessage: "주말 모임 어디서 할지 정하자",
    isGroup: true,
    memberCount: 6,
    messages: [
      {
        id: "g1",
        senderId: "f4",
        senderName: "서연",
        senderColor: "pink",
        text: "이번 주말 모임 어디서 할까? 강남 / 홍대 / 성수 중에 의견 좀 줘봐",
        time: "어제 22:10",
        tone: "ask",
        isMine: false,
        raisedBy: [
          { id: "f1", name: "민수", color: "amber", raisedAt: "방금" },
          { id: "f2", name: "지은", color: "green", raisedAt: "5분 전" },
        ],
      },
      {
        id: "g2",
        senderId: "f3",
        senderName: "준호",
        senderColor: "purple",
        text: "성수 좋다 👍",
        time: "어제 22:18",
        isMine: false,
      },
      {
        id: "g3",
        senderId: "me",
        text: "성수 콜! 시간은?",
        time: "어제 22:30",
        isMine: true,
        isRead: true,
      },
      {
        id: "g4",
        senderId: "f4",
        senderName: "서연",
        senderColor: "pink",
        text: "이거 어때? 분위기 좋아 보임",
        time: "어제 22:45",
        tone: "share",
        isMine: false,
      },
    ],
  },
  {
    id: "4",
    name: "준호",
    color: "purple",
    presence: "off",
    time: "2일 전",
    lastMessage: "ㅇㅋ 주말에 보자",
    messages: [
      {
        id: "p1",
        senderId: "4",
        text: "이 글 한번 읽어봐 — DHH가 AI 비판한 거",
        time: "2일 전",
        tone: "share",
        isMine: false,
      },
      {
        id: "p2",
        senderId: "me",
        text: "ㅇㅋ 시간 날 때 볼게",
        time: "2일 전",
        isMine: true,
        isRead: true,
      },
      {
        id: "p3",
        senderId: "4",
        text: "ㅇㅋ 주말에 보자",
        time: "2일 전",
        isMine: false,
      },
    ],
  },
];

export const MOCK_FEED: FeedItem[] = [
  {
    id: "f1",
    chatId: "1",
    type: "ask",
    author: { name: "민수", color: "amber" },
    time: "08:44",
    meta: "오늘 중 답장",
    messages: [
      { text: "물어봄", tone: "ask" },
      { text: "혹시 오늘 저녁 약속 가능해? 지은이랑 같이 보려고" },
      { text: "장소는 강남이나 성수 둘 중에 골라줘" },
    ],
  },
  {
    id: "f2",
    chatId: "3",
    type: "ask",
    author: { name: "서연", color: "pink" },
    time: "어제 22:10",
    meta: "그룹 · 2명 답함",
    messages: [
      { text: "물어봄", tone: "ask" },
      {
        text: "이번 주말 모임 어디서 할까? 강남 / 홍대 / 성수 중에 의견 좀 줘봐",
      },
    ],
  },
  {
    id: "f3",
    chatId: "1",
    type: "chat",
    author: { name: "민수", color: "amber" },
    time: "어제 22:10",
    meta: "수다 4건",
    messages: [
      { text: "수다", tone: "chat" },
      { text: "오늘 야근인데 미치겠다 ㅋㅋㅋ", time: "어제" },
      {
        text: "새 팀장 어떤 것 같냐고 물어봐도 돼? 엄청 빡세 보임",
        time: "어제",
      },
    ],
  },
];

export interface FriendItem {
  id: string;
  name: string;
  handle: string;
  color: AvatarColor;
  presence: "free" | "working" | "focus" | "off";
  avatarUrl?: string;
}

export const MOCK_FRIENDS: FriendItem[] = [
  {
    id: "f1",
    name: "민수",
    handle: "minsu",
    color: "amber",
    presence: "working",
  },
  {
    id: "f2",
    name: "지은",
    handle: "jieun",
    color: "green",
    presence: "free",
  },
  {
    id: "f3",
    name: "준호",
    handle: "junho",
    color: "purple",
    presence: "off",
  },
  {
    id: "f4",
    name: "서연",
    handle: "seoyeon",
    color: "pink",
    presence: "focus",
  },
];

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
 *  Notifications (Attention 컨텍스트)
 * ───────────────────────────────────────────────────────── */
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    sender: { name: "민수", color: "amber" },
    roomName: "민수",
    preview: "혹시 오늘 저녁 약속 가능해? 지은이랑 같이 보려고",
    tone: "ask" as NotificationTone,
    delivery: "immediate" as NotificationDelivery,
    time: "방금",
    isRead: false,
  },
  {
    id: "n2",
    sender: { name: "서연", color: "pink" },
    roomName: "대학 동기방",
    preview: "이번 주말 모임 어디서 할까? 강남 / 홍대 / 성수 중에 의견 좀 줘봐",
    tone: "ask",
    delivery: "queued",
    time: "10분 전",
    isRead: false,
  },
  {
    id: "n3",
    sender: { name: "팀 딥퐁", color: "blue" },
    roomName: "공지",
    preview:
      "이번 주 집중 시간이 평균 3시간 28분이에요. 지난주보다 24분 늘었어요!",
    tone: "share",
    delivery: "batched",
    time: "1시간 전",
    isRead: false,
  },
  {
    id: "n4",
    sender: { name: "지은", color: "green" },
    roomName: "지은",
    preview: "회의 끝나고 톡할게!",
    tone: "chat",
    delivery: "batched",
    time: "어제",
    isRead: true,
  },
  {
    id: "n5",
    sender: { name: "준호", color: "purple" },
    roomName: "준호",
    preview: "이 글 한번 읽어봐 — DHH가 AI 비판한 거",
    tone: "share",
    delivery: "queued",
    time: "2일 전",
    isRead: true,
  },
  {
    id: "n6",
    sender: { name: "민수", color: "amber" },
    roomName: "민수",
    preview: "내일 회의 시간 미루는 거 가능?",
    tone: "urgent",
    delivery: "immediate",
    time: "3일 전",
    isRead: true,
  },
];

/* ─────────────────────────────────────────────────────────
 *  Catchup feed (Catchup 컨텍스트)
 * ───────────────────────────────────────────────────────── */
export const MOCK_CATCHUP: CatchupItem[] = [
  {
    id: "c1",
    type: "ask",
    author: { name: "민수", color: "amber" },
    meta: "오늘 중 답장",
    time: "08:44",
    primaryActionLabel: "대화 열기",
    secondaryActionLabel: "읽음 처리",
    messages: [
      { text: "물어봄", tone: "ask" },
      { text: "혹시 오늘 저녁 약속 가능해? 지은이랑 같이 보려고" },
      { text: "장소는 강남이나 성수 둘 중에 골라줘" },
    ],
  },
  {
    id: "c2",
    type: "ask",
    author: { name: "서연", color: "pink" },
    meta: "대학 동기방 · 2명 답함",
    time: "어제 22:10",
    primaryActionLabel: "대화 열기",
    messages: [
      { text: "물어봄", tone: "ask" },
      {
        text: "이번 주말 모임 어디서 할까? 강남 / 홍대 / 성수 중에 의견 좀 줘봐",
      },
    ],
  },
  {
    id: "c3",
    type: "chat",
    author: { name: "민수", color: "amber" },
    meta: "수다 4건",
    time: "어제 22:10",
    primaryActionLabel: "대화 열기",
    messages: [
      { text: "수다", tone: "chat" },
      { text: "오늘 야근인데 미치겠다 ㅋㅋㅋ", time: "어제" },
      {
        text: "새 팀장 어떤 것 같냐고 물어봐도 돼? 엄청 빡세 보임",
        time: "어제",
      },
    ],
  },
  {
    id: "c4",
    type: "share",
    author: { name: "준호", color: "purple" },
    meta: "공유 1건",
    time: "2일 전",
    primaryActionLabel: "링크 열기",
    messages: [
      { text: "공유", tone: "share" },
      { text: "DHH on Anti-AI Bias — world.hey.com" },
    ],
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

/* ─────────────────────────────────────────────────────────
 *  Communication Norms (Relationship 컨텍스트)
 * ───────────────────────────────────────────────────────── */
export const DEFAULT_NORM: CommunicationNorm = {
  rules: {
    chat: "batched",
    ask: "immediate",
    urgent: "immediate",
    share: "batched",
  },
  isPriority: false,
  isBlocked: false,
};

export const MOCK_NORMS: Record<string, CommunicationNorm> = {
  f1: {
    rules: {
      chat: "batched",
      ask: "immediate",
      urgent: "immediate",
      share: "batched",
    },
    isPriority: true,
    isBlocked: false,
  },
  f2: {
    rules: {
      chat: "immediate",
      ask: "immediate",
      urgent: "immediate",
      share: "immediate",
    },
    isPriority: true,
    isBlocked: false,
  },
  f3: {
    rules: {
      chat: "queued",
      ask: "batched",
      urgent: "immediate",
      share: "queued",
    },
    isPriority: false,
    isBlocked: false,
  },
  f4: {
    rules: {
      chat: "batched",
      ask: "immediate",
      urgent: "immediate",
      share: "batched",
    },
    isPriority: false,
    isBlocked: false,
  },
};

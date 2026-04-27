import { ToneType } from "@/app/_components/Chip/types";
import { AvatarColor } from "@/app/_components/Avatar";

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  time: string;
  tone?: ToneType;
  isMine: boolean;
  isRead?: boolean;
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
    messages: [], // 빈 방 테스트용
  },
  {
    id: "3",
    name: "대학 동기방",
    color: "gray",
    presence: "free",
    time: "어제",
    unreadCounts: { share: 7 },
    lastMessage: "링크 공유",
  },
  {
    id: "4",
    name: "준호",
    color: "purple",
    presence: "off",
    time: "2일 전",
    lastMessage: "ㅇㅋ 주말에 보자",
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

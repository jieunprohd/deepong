import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotificationCenter, NotificationItem } from "./NotificationCenter";
import { useState } from "react";

const meta: Meta<typeof NotificationCenter> = {
  title: "Features/Attention/NotificationCenter",
  component: NotificationCenter,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof NotificationCenter>;

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    sender: { name: "민수", color: "amber" },
    roomName: "민수",
    preview: "혹시 오늘 저녁 약속 가능해? 지은이랑 같이 보려고",
    tone: "ask",
    delivery: "immediate",
    time: "08:44",
    isRead: false,
  },
  {
    id: "n2",
    sender: { name: "지은", color: "green" },
    roomName: "지은",
    preview: "회의 끝나고 톡할게!",
    tone: "chat",
    delivery: "batched",
    time: "1시간 전",
    isRead: false,
  },
  {
    id: "n3",
    sender: { name: "준호", color: "purple" },
    roomName: "대학 동기방",
    preview: "긴급 — 내일 발표 준비 상태 공유 부탁드려요",
    tone: "urgent",
    delivery: "immediate",
    time: "2시간 전",
    isRead: false,
  },
  {
    id: "n4",
    sender: { name: "서연", color: "pink" },
    preview: "Notion 퍼블릭 문서 공유드려요",
    tone: "share",
    delivery: "queued",
    time: "어제",
    isRead: true,
  },
];

export const Default: Story = {
  render: function Render() {
    const [items, setItems] = useState(MOCK_NOTIFICATIONS);
    return (
      <div className="h-[600px] w-[420px] overflow-hidden rounded-[var(--r-lg)] border border-[var(--gray-200)]">
        <NotificationCenter
          notifications={items}
          onSelect={(id) => alert(`select ${id}`)}
          onDismiss={(id) =>
            setItems((prev) => prev.filter((i) => i.id !== id))
          }
          onMarkAllRead={() =>
            setItems((prev) => prev.map((i) => ({ ...i, isRead: true })))
          }
        />
      </div>
    );
  },
};

export const Empty: Story = {
  render: () => (
    <div className="h-[600px] w-[420px] overflow-hidden rounded-[var(--r-lg)] border border-[var(--gray-200)]">
      <NotificationCenter notifications={[]} />
    </div>
  ),
};

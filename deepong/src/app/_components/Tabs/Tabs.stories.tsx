import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs } from "./";
import { useState } from "react";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const ITEMS = [
  { value: "all", label: "전체" },
  { value: "ask", label: "🤔 물어봄" },
  { value: "urgent", label: "⚡ 급함" },
  { value: "share", label: "📎 공유" },
];

export const Underline: Story = {
  render: function Render() {
    const [v, setV] = useState("all");
    return (
      <div className="w-[480px]">
        <Tabs items={ITEMS} value={v} onChange={setV} />
        <div className="mt-4 text-[13px] text-[var(--gray-600)]">선택: {v}</div>
      </div>
    );
  },
};

export const Segmented: Story = {
  render: function Render() {
    const [v, setV] = useState("all");
    return (
      <div className="w-[480px]">
        <Tabs items={ITEMS} variant="segmented" value={v} onChange={setV} />
      </div>
    );
  },
};

export const WithTrailingBadge: Story = {
  render: function Render() {
    const [v, setV] = useState("unread");
    return (
      <Tabs
        variant="segmented"
        value={v}
        onChange={setV}
        items={[
          { value: "all", label: "전체" },
          {
            value: "unread",
            label: "안 읽음",
            trailing: (
              <span className="rounded-full bg-[var(--danger)] px-1.5 text-[10px] font-bold text-white">
                12
              </span>
            ),
          },
          { value: "mentioned", label: "멘션" },
        ]}
      />
    );
  },
};

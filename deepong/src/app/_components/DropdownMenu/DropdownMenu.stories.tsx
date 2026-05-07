import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DropdownMenu } from "./";
import { Button } from "../Button";
import {
  Edit3,
  Trash2,
  Archive,
  Star,
  MoreHorizontal,
  Bell,
  BellOff,
} from "lucide-react";

const meta: Meta<typeof DropdownMenu> = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => (
    <DropdownMenu
      trigger={
        <button
          className="
            flex h-9 w-9 items-center justify-center rounded-md
            text-[var(--gray-600)] hover:bg-[var(--gray-100)]
          "
        >
          <MoreHorizontal size={18} />
        </button>
      }
      items={[
        {
          id: "edit",
          label: "수정",
          icon: <Edit3 size={14} />,
          onSelect: () => alert("edit"),
        },
        {
          id: "archive",
          label: "보관",
          icon: <Archive size={14} />,
          trailing: "⌘E",
        },
        {
          id: "delete",
          label: "삭제",
          icon: <Trash2 size={14} />,
          danger: true,
        },
      ]}
    />
  ),
};

export const Sectioned: Story = {
  render: () => (
    <DropdownMenu
      trigger={<Button variant="outline">옵션</Button>}
      sections={[
        {
          heading: "알림",
          items: [
            {
              id: "favorite",
              label: "우선 친구로 지정",
              icon: <Star size={14} />,
            },
            { id: "mute", label: "알림 끄기", icon: <BellOff size={14} /> },
            { id: "notify", label: "모든 알림 받기", icon: <Bell size={14} /> },
          ],
        },
        {
          heading: "관계",
          items: [
            {
              id: "block",
              label: "차단하기",
              icon: <Trash2 size={14} />,
              danger: true,
            },
          ],
        },
      ]}
    />
  ),
};

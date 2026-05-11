import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  CommunicationNormModal,
  type CommunicationNorm,
} from "./CommunicationNormModal";
import { Button } from "@/app/_components/Button";
import { useState } from "react";

const meta: Meta<typeof CommunicationNormModal> = {
  title: "Features/Relationship/CommunicationNormModal",
  component: CommunicationNormModal,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof CommunicationNormModal>;

const INITIAL_NORM: CommunicationNorm = {
  id: 1,
  ownerUserId: 100,
  friendUserId: 200,
  defaultTone: "CHAT",
  allowUrgent: true,
  shareReadReceipt: true,
  sharePresence: true,
  shareWorktime: true,
  feedPriority: "NORMAL",
  nicknameMemo: null,
  muted: false,
  isPriorityFriend: false,
  isMuted: false,
  updatedAt: new Date().toISOString(),
};

export const Default: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>알림 규범 열기</Button>
        <CommunicationNormModal
          isOpen={open}
          onClose={() => setOpen(false)}
          peer={{
            id: "u1",
            nickname: "민수",
            handle: "minsu",
            color: "amber",
          }}
          initialNorm={INITIAL_NORM}
          onSave={() => setOpen(false)}
        />
      </>
    );
  },
};

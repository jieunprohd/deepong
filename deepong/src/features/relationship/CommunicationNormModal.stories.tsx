import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  CommunicationNormModal,
  CommunicationNorm,
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
  rules: {
    chat: "batched",
    ask: "immediate",
    urgent: "immediate",
    share: "queued",
  },
  isPriority: false,
  isBlocked: false,
};

export const Default: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [norm, setNorm] = useState(INITIAL_NORM);
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
          initialNorm={norm}
          onSave={(next) => {
            setNorm(next);
            setOpen(false);
          }}
        />
      </>
    );
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CreateInvitationModal } from "./CreateInvitationModal";
import { Button } from "@/app/_components/Button";
import { useState } from "react";

const meta: Meta<typeof CreateInvitationModal> = {
  title: "Features/CreateInvitationModal",
  component: CreateInvitationModal,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof CreateInvitationModal>;

export const Default: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>친구 초대</Button>
        <CreateInvitationModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};

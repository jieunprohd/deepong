import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PresenceSelector, Presence } from "./PresenceSelector";
import { useState } from "react";

const meta: Meta<typeof PresenceSelector> = {
  title: "Features/Attention/PresenceSelector",
  component: PresenceSelector,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof PresenceSelector>;

export const Default: Story = {
  render: function Render() {
    const [v, setV] = useState<Presence>("focus");
    const [m, setM] = useState("딥워크 중 🔵");
    return (
      <div className="flex h-[400px] items-start justify-center">
        <PresenceSelector
          value={v}
          onChange={setV}
          statusMessage={m}
          onStatusMessageChange={setM}
        />
      </div>
    );
  },
};

export const Compact: Story = {
  render: function Render() {
    const [v, setV] = useState<Presence>("working");
    return (
      <div className="flex h-[400px] items-start justify-center">
        <PresenceSelector value={v} onChange={setV} compact />
      </div>
    );
  },
};

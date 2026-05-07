import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Switch } from "./";
import { useState } from "react";

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: function Render() {
    const [v, setV] = useState(false);
    return <Switch checked={v} onChange={setV} />;
  },
};

export const WithLabel: Story = {
  render: function Render() {
    const [v, setV] = useState(true);
    return (
      <div className="w-[320px]">
        <Switch
          checked={v}
          onChange={setV}
          label="우선 친구"
          description="집중 모드 중에도 이 친구의 알림은 받아요"
        />
      </div>
    );
  },
};

export const Sizes: Story = {
  render: function Render() {
    const [a, setA] = useState(true);
    const [b, setB] = useState(false);
    return (
      <div className="flex items-center gap-6">
        <Switch checked={a} onChange={setA} size="sm" />
        <Switch checked={b} onChange={setB} size="md" />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Switch checked onChange={() => {}} disabled />
      <Switch checked={false} onChange={() => {}} disabled />
    </div>
  ),
};

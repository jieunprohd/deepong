import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { label: 5, tone: "danger" },
};

export const Tones: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge label={1} tone="neutral" />
      <Badge label={3} tone="brand" />
      <Badge label={7} tone="success" />
      <Badge label="2h" tone="warning" />
      <Badge label={12} tone="danger" />
      <Badge label={99} tone="info" />
    </div>
  ),
};

export const Overflow: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge label={9} tone="danger" />
      <Badge label={42} tone="danger" />
      <Badge label={150} tone="danger" />
      <Badge label={1200} tone="danger" />
    </div>
  ),
};

export const Dot: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge dot tone="danger" />
      <Badge dot tone="warning" />
      <Badge dot tone="success" />
      <Badge dot tone="brand" />
    </div>
  ),
};

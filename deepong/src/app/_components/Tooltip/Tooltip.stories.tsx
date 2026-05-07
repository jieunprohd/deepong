import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tooltip } from "./";
import { Button } from "../Button";
import { Info } from "lucide-react";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: "이건 툴팁이에요",
    placement: "top",
    children: <Button variant="outline">호버해 보세요</Button>,
  },
};

export const AllPlacements: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-12">
      {(["top", "bottom", "left", "right"] as const).map((p) => (
        <Tooltip key={p} content={`${p} placement`} placement={p}>
          <Button variant="outline">{p}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    content: "더 많은 정보가 여기에 표시됩니다",
    children: (
      <button className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--gray-500)] hover:bg-[var(--gray-100)]">
        <Info size={16} />
      </button>
    ),
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton, SkeletonList } from "./";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  args: { variant: "text", width: 240 },
};

export const Circle: Story = {
  args: { variant: "circle", width: 56, height: 56 },
};

export const Rect: Story = {
  args: { variant: "rect", width: 320, height: 120 },
};

export const ChatRowSkeleton: Story = {
  render: () => (
    <div className="w-[320px] space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <Skeleton variant="circle" width={38} height={38} />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" height={14} />
            <div className="mt-1.5">
              <SkeletonList count={2} lineHeight={10} gap={6} />
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};

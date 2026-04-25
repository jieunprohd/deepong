import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "./index";

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    label: "시간대",
    options: [
      { label: "대한민국 표준시 (KST, UTC+9)", value: "KST" },
      { label: "일본 표준시 (JST, UTC+9)", value: "JST" },
      { label: "태평양 표준시 (PST, UTC-8)", value: "PST" },
    ],
  },
};

export const WithError: Story = {
  args: {
    label: "국가 선택",
    options: [
      { label: "대한민국", value: "KR" },
      { label: "미국", value: "US" },
    ],
    error: "국가를 선택해 주세요.",
  },
};

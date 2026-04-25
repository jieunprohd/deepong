import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DaySelector } from "./index";

const meta: Meta<typeof DaySelector> = {
  title: "Components/DaySelector",
  component: DaySelector,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DaySelector>;

export const Default: Story = {
  args: {
    label: "업무 요일 선택",
    selectedDays: ["mon", "tue", "wed", "thu", "fri"],
    onChange: (days) => console.log("Selected days:", days),
  },
};

export const WeekendOnly: Story = {
  args: {
    label: "주말 알림 설정",
    selectedDays: ["sat", "sun"],
    onChange: (days) => console.log("Selected days:", days),
  },
};

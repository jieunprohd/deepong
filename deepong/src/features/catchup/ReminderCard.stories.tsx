import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReminderCard } from "./ReminderCard";
import { useState } from "react";

const meta: Meta<typeof ReminderCard> = {
  title: "Features/Catchup/ReminderCard",
  component: ReminderCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof ReminderCard>;

export const Default: Story = {
  render: function Render() {
    const [done, setDone] = useState(false);
    return (
      <div className="w-[480px]">
        <ReminderCard
          type="reply"
          title="민수에게 답장하기"
          description="저녁 약속 가능 여부 + 시간대 제안"
          triggerAt="오늘 18:00"
          relatedTo="민수"
          isCompleted={done}
          onComplete={() => setDone((v) => !v)}
          onSnooze={() => {}}
          onMore={() => {}}
        />
      </div>
    );
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-[480px] flex-col gap-2.5">
      <ReminderCard
        type="reply"
        title="민수에게 답장"
        triggerAt="오늘 18:00"
        relatedTo="민수"
      />
      <ReminderCard
        type="schedule"
        title="회의 준비"
        description="자료 정리 + 안건 공유"
        triggerAt="내일 09:30"
        relatedTo="대학 동기방"
      />
      <ReminderCard
        type="followup"
        title="팀장님께 결과 공유"
        triggerAt="이번 주 금요일"
      />
      <ReminderCard
        type="custom"
        title="커피 사기"
        triggerAt="오후 3시"
        isCompleted
      />
    </div>
  ),
};

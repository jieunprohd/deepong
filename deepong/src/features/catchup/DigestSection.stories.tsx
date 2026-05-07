import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DigestSection } from "./DigestSection";
import { Sparkles } from "lucide-react";

const meta: Meta<typeof DigestSection> = {
  title: "Features/Catchup/DigestSection",
  component: DigestSection,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof DigestSection>;

export const Default: Story = {
  render: () => (
    <div className="w-[640px]">
      <DigestSection
        title="지금 신경 써야 할 것"
        meta="3건"
        accent="warning"
        action={{ label: "전체 보기", onClick: () => {} }}
      >
        <div className="rounded-[var(--r-md)] border border-[var(--gray-200)] bg-white p-3 text-[13px]">
          물어봄 · 민수 — 저녁 약속 가능?
        </div>
        <div className="rounded-[var(--r-md)] border border-[var(--gray-200)] bg-white p-3 text-[13px]">
          물어봄 · 지은 — 발표 자료 검토 부탁
        </div>
      </DigestSection>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="w-[640px]">
      <DigestSection
        title="오늘의 하이라이트"
        description="놓치면 아쉬운 메시지를 모았어요"
        icon={<Sparkles size={16} />}
        accent="brand"
      >
        <div className="rounded-[var(--r-md)] bg-[var(--gray-50)] p-3 text-[12px] text-[var(--gray-600)]">
          (콘텐츠 영역)
        </div>
      </DigestSection>
    </div>
  ),
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CatchupList, CatchupItem } from "./CatchupList";

const meta: Meta<typeof CatchupList> = {
  title: "Features/Catchup/CatchupList",
  component: CatchupList,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof CatchupList>;

const MOCK_ITEMS: CatchupItem[] = [
  {
    id: "1",
    type: "ask",
    author: { name: "민수", color: "amber" },
    meta: "오늘 중 답장",
    time: "08:44",
    messages: [
      { tone: "ask", text: "물어봄" },
      { text: "혹시 오늘 저녁 약속 가능해? 지은이랑 같이 보려고" },
      { text: "장소는 강남이나 성수 둘 중에 골라줘" },
    ],
  },
  {
    id: "2",
    type: "urgent",
    author: { name: "준호", color: "purple" },
    meta: "긴급",
    time: "10분 전",
    messages: [
      { tone: "urgent", text: "급함" },
      { text: "내일 발표 자료 마지막으로 검토 부탁드려요" },
    ],
  },
  {
    id: "3",
    type: "chat",
    author: { name: "민수", color: "amber" },
    meta: "수다 4건",
    time: "어제 22:10",
    messages: [
      { tone: "chat", text: "수다" },
      { text: "오늘 야근인데 미치겠다 ㅋㅋㅋ", time: "어제" },
      { text: "새 팀장 어떤 것 같냐?", time: "어제" },
    ],
  },
];

export const Default: Story = {
  render: () => (
    <div className="w-[640px]">
      <CatchupList
        items={MOCK_ITEMS}
        onPrimaryAction={(id) => alert(`open ${id}`)}
        onSecondaryAction={(id) => alert(`mark read ${id}`)}
      />
    </div>
  ),
};

export const ClickableItems: Story = {
  render: () => (
    <div className="w-[640px]">
      <CatchupList
        items={MOCK_ITEMS}
        onSelect={(id) => alert(`selected ${id}`)}
      />
    </div>
  ),
};

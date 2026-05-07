import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HandRaisePanel } from "./HandRaisePanel";
import { useState } from "react";

const meta: Meta<typeof HandRaisePanel> = {
  title: "Features/Communication/HandRaisePanel",
  component: HandRaisePanel,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof HandRaisePanel>;

export const Default: Story = {
  render: function Render() {
    const [raised, setRaised] = useState(false);
    return (
      <div className="w-[420px]">
        <HandRaisePanel
          questionAuthor="민수"
          questionText="혹시 오늘 저녁 약속 가능해? 지은이랑 같이 보려고"
          isRaised={raised}
          onToggle={() => setRaised((v) => !v)}
          raisedBy={[
            { id: "u1", name: "지은", color: "green", raisedAt: "방금" },
            { id: "u2", name: "서연", color: "pink", raisedAt: "5분 전" },
          ]}
        />
      </div>
    );
  },
};

export const Empty: Story = {
  render: function Render() {
    const [raised, setRaised] = useState(false);
    return (
      <div className="w-[420px]">
        <HandRaisePanel
          questionAuthor="준호"
          questionText="MVP 데모 누가 맡을지 정해야 해요"
          isRaised={raised}
          onToggle={() => setRaised((v) => !v)}
          raisedBy={[]}
        />
      </div>
    );
  },
};

export const OwnQuestion: Story = {
  render: () => (
    <div className="w-[420px]">
      <HandRaisePanel
        questionAuthor="(나)"
        questionText="다음 주 미팅 일정 가능한 사람?"
        isRaised={false}
        onToggle={() => {}}
        isOwnQuestion
        raisedBy={[
          { id: "u1", name: "민수", color: "amber", raisedAt: "10분 전" },
          { id: "u2", name: "지은", color: "green", raisedAt: "20분 전" },
          { id: "u3", name: "서연", color: "pink", raisedAt: "30분 전" },
        ]}
      />
    </div>
  ),
};

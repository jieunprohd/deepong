import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MessageComposer from "./index";

const meta: Meta<typeof MessageComposer> = {
  title: "Components/MessageComposer",
  component: MessageComposer,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MessageComposer>;

export const Default: Story = {
  args: {
    tone: "chat",
    onToneChange: (tone) => console.log("Tone changed:", tone),
    onSend: (msg) => console.log("Message sent:", msg),
  },
};

export const WithValue: Story = {
  args: {
    tone: "ask",
    placeholder: "질문을 입력해 보세요",
  },
};

export const Disabled: Story = {
  args: {
    tone: "chat",
    disabled: true,
    placeholder: "지금은 메시지를 보낼 수 없습니다.",
  },
};

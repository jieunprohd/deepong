import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ToastProvider, useToast } from "./";
import { Button } from "../Button";

const meta: Meta<typeof ToastProvider> = {
  title: "Components/Toast",
  component: ToastProvider,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

function Demo() {
  const { show } = useToast();
  return (
    <div className="flex flex-col gap-2 w-[260px]">
      <Button
        variant="primary"
        onClick={() => show({ message: "메시지를 보냈어요" })}
      >
        info 토스트
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          show({ tone: "success", message: "변경사항이 저장됐어요" })
        }
      >
        success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          show({
            tone: "warning",
            message: "급함 메시지는 하루 3번까지만 보낼 수 있어요",
          })
        }
      >
        warning
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          show({
            tone: "danger",
            message: "전송에 실패했어요",
            action: { label: "다시", onClick: () => {} },
            duration: 0,
          })
        }
      >
        danger + action
      </Button>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  ),
};

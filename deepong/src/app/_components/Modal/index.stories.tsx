import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Modal } from "./index";
import { Button } from "../Button";
import { useState } from "react";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>모달 열기</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="알림 설정"
        >
          <p className="text-[13px] text-[var(--gray-600)]">
            모달 내용이 여기에 표시됩니다.
          </p>
        </Modal>
      </>
    );
  },
};

export const WithoutTitle: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>타이틀 없는 모달</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="pt-4 text-center">
            <p className="text-[15px] font-bold text-[var(--gray-900)]">
              정말 삭제하시겠어요?
            </p>
            <p className="mt-1 text-[13px] text-[var(--gray-500)]">
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setIsOpen(false)}
              >
                취소
              </Button>
              <Button variant="danger" fullWidth>
                삭제
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};

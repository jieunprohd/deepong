import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  FocusTimer,
  FocusPhase,
  FocusPreset,
  DEFAULT_PRESETS,
} from "./FocusTimer";
import { useEffect, useState } from "react";

const meta: Meta<typeof FocusTimer> = {
  title: "Features/Attention/FocusTimer",
  component: FocusTimer,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof FocusTimer>;

export const Idle: Story = {
  render: () => (
    <div className="w-[360px]">
      <FocusTimer
        phase="focus"
        remainingSeconds={25 * 60}
        totalSeconds={25 * 60}
        isRunning={false}
        onToggle={() => {}}
        onReset={() => {}}
      />
    </div>
  ),
};

export const Running: Story = {
  render: function Render() {
    const [phase, setPhase] = useState<FocusPhase>("focus");
    const [preset, setPreset] = useState<FocusPreset>(DEFAULT_PRESETS[0]);
    const total = preset.focus * 60;
    const [remaining, setRemaining] = useState(total - 600); // 10분 경과
    const [running, setRunning] = useState(true);

    useEffect(() => {
      if (!running) return;
      const id = setInterval(() => {
        setRemaining((r) => Math.max(0, r - 1));
      }, 1000);
      return () => clearInterval(id);
    }, [running]);

    return (
      <div className="w-[360px]">
        <FocusTimer
          phase={phase}
          onPhaseChange={(p) => {
            setPhase(p);
            setRemaining(
              p === "focus"
                ? preset.focus * 60
                : p === "short-break"
                  ? preset.shortBreak * 60
                  : preset.longBreak * 60,
            );
          }}
          remainingSeconds={remaining}
          totalSeconds={total}
          isRunning={running}
          onToggle={() => setRunning((v) => !v)}
          onReset={() => setRemaining(total)}
          preset={preset}
          presets={DEFAULT_PRESETS}
          onPresetChange={(p) => {
            setPreset(p);
            setRemaining(p.focus * 60);
          }}
        />
      </div>
    );
  },
};

export const ShortBreak: Story = {
  render: () => (
    <div className="w-[360px]">
      <FocusTimer
        phase="short-break"
        remainingSeconds={3 * 60 + 24}
        totalSeconds={5 * 60}
        isRunning
        onToggle={() => {}}
        onReset={() => {}}
        currentCycle={2}
        totalCycles={4}
      />
    </div>
  ),
};

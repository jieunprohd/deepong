export interface DaySelectorProps {
  selectedDays: string[];
  onChange: (days: string[]) => void;
  label?: string;
}

export const DAYS = [
  { label: "월", value: "mon" },
  { label: "화", value: "tue" },
  { label: "수", value: "wed" },
  { label: "목", value: "thu" },
  { label: "금", value: "fri" },
  { label: "토", value: "sat", isWeekend: true },
  { label: "일", value: "sun", isWeekend: true },
];

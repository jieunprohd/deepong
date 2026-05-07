export const DAY_VALUES: { label: string; value: string; weekday: number }[] = [
  { label: "월", value: "mon", weekday: 1 },
  { label: "화", value: "tue", weekday: 2 },
  { label: "수", value: "wed", weekday: 3 },
  { label: "목", value: "thu", weekday: 4 },
  { label: "금", value: "fri", weekday: 5 },
  { label: "토", value: "sat", weekday: 6 },
  { label: "일", value: "sun", weekday: 0 },
];

const DAY_TO_WEEKDAY = new Map(DAY_VALUES.map((d) => [d.value, d.weekday]));
const WEEKDAY_TO_DAY = new Map(DAY_VALUES.map((d) => [d.weekday, d.value]));

export function dayValuesToWeekdays(values: string[]): number[] {
  return values
    .map((v) => DAY_TO_WEEKDAY.get(v))
    .filter((n): n is number => n !== undefined)
    .sort((a, b) => a - b);
}

export function weekdaysToDayValues(weekdays: number[]): string[] {
  return weekdays
    .map((n) => WEEKDAY_TO_DAY.get(n))
    .filter((v): v is string => v !== undefined);
}

export const TIMEZONE_OPTIONS = [
  { label: "한국 표준시 (Asia/Seoul)", value: "Asia/Seoul" },
  { label: "일본 표준시 (Asia/Tokyo)", value: "Asia/Tokyo" },
  { label: "중국 표준시 (Asia/Shanghai)", value: "Asia/Shanghai" },
  { label: "싱가포르 (Asia/Singapore)", value: "Asia/Singapore" },
  { label: "협정 세계시 (UTC)", value: "UTC" },
  { label: "런던 (Europe/London)", value: "Europe/London" },
  { label: "베를린 (Europe/Berlin)", value: "Europe/Berlin" },
  { label: "뉴욕 (America/New_York)", value: "America/New_York" },
  { label: "로스앤젤레스 (America/Los_Angeles)", value: "America/Los_Angeles" },
];

export const NICKNAME_MAX_LENGTH = 50;
export const BIO_MAX_LENGTH = 200;

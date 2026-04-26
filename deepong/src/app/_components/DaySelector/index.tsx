"use client";

import React from "react";
import { DAYS, DaySelectorProps } from "./types";

export const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDays,
  onChange,
  label,
}) => {
  const toggleDay = (value: string) => {
    if (selectedDays.includes(value)) {
      onChange(selectedDays.filter((d) => d !== value));
    } else {
      onChange([...selectedDays, value]);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-[13px] font-semibold text-(--gray-700)">
          {label}
        </label>
      )}
      <div className="flex gap-1.5">
        {DAYS.map((day) => {
          const isActive = selectedDays.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`
                flex-1 h-10 rounded-md text-[13px] font-semibold transition-all duration-200
                ${
                  isActive
                    ? "bg-(--brand-primary) text-white border-(--brand-primary)"
                    : "bg-white text-(--gray-600) border border-(--gray-200) hover:bg-(--gray-50)"
                }
                ${day.isWeekend && !isActive ? "text-(--gray-400)" : ""}
              `}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

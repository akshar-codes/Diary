import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { getTodayDateKey } from "@notes/shared";

interface CalendarPickerProps {
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  datesWithEntries?: Set<string>;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDateKey,
  onSelectDate,
  datesWithEntries = new Set(),
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [year, month] = selectedDateKey.split("-").map(Number);
    return new Date(year, month - 1, 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const todayKey = getTodayDateKey();

  const days = [];
  // Empty spaces for preceding days of week
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push({ day, dateKey: dKey });
  }

  return (
    <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          {monthName}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => (
          <span key={w} className="text-[10px] font-medium text-zinc-400">
            {w}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((item, idx) => {
          if (!item) return <div key={`empty-${idx}`} className="h-7 w-7" />;

          const isSelected = item.dateKey === selectedDateKey;
          const isToday = item.dateKey === todayKey;
          const hasEntry = datesWithEntries.has(item.dateKey);

          return (
            <button
              key={item.dateKey}
              onClick={() => onSelectDate(item.dateKey)}
              className={`relative h-7 w-7 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs font-semibold"
                  : isToday
                    ? "border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {item.day}
              {hasEntry && (
                <span
                  className={`absolute bottom-1 w-1 h-1 rounded-full ${
                    isSelected
                      ? "bg-amber-400 dark:bg-amber-500"
                      : "bg-zinc-400 dark:bg-zinc-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

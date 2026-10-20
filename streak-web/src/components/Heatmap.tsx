import React, { useMemo } from "react";
import { format, subDays, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";

export interface TaskLog {
  id?: string | number;
  _id?: string | number;
  taskId?: string | number;
  task_id?: string | number;
  completed_at: string | Date;
}

interface HeatmapProps {
  logs: TaskLog[];
  taskTitle: string;
  currentStreak: number;
  longestStreak: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  logs,
  taskTitle,
  currentStreak,
  longestStreak,
}) => {
  // Generate 52 weeks of dates up to today
  const { weeks, monthLabels, totalCompletions } = useMemo(() => {
    const today = new Date();
    // 52 weeks = 364 days
    const startDate = startOfWeek(subDays(today, 364), { weekStartsOn: 0 }); // Sunday start
    
    // Convert logs into a Map of date strings (YYYY-MM-DD) -> count
    const dateCounts = new Map<string, number>();
    logs.forEach((log) => {
      try {
        const d = typeof log.completed_at === "string" ? parseISO(log.completed_at) : new Date(log.completed_at);
        const key = format(d, "yyyy-MM-dd");
        dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
      } catch {
        // ignore malformed date
      }
    });

    const weeksArray: { date: Date; dateStr: string; count: number; isFuture: boolean }[][] = [];
    const months: { label: string; colIndex: number }[] = [];
    let currentMonth = -1;

    let cursorDate = startDate;
    for (let w = 0; w < 53; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(cursorDate);
        const dateStr = format(dateObj, "yyyy-MM-dd");
        const count = dateCounts.get(dateStr) || 0;
        const isFuture = dateObj > today && !isSameDay(dateObj, today);

        weekDays.push({
          date: dateObj,
          dateStr,
          count,
          isFuture,
        });

        if (d === 0) {
          const monthIndex = dateObj.getMonth();
          if (monthIndex !== currentMonth) {
            currentMonth = monthIndex;
            months.push({
              label: format(dateObj, "MMM"),
              colIndex: w,
            });
          }
        }

        cursorDate = addDays(cursorDate, 1);
      }
      weeksArray.push(weekDays);
    }

    return {
      weeks: weeksArray,
      monthLabels: months,
      totalCompletions: logs.length,
    };
  }, [logs]);

  // Color intensity scale based on count
  const getColorClass = (count: number, isFuture: boolean) => {
    if (isFuture) return "bg-zinc-900/30 border-transparent opacity-30 cursor-not-allowed";
    if (count === 0) return "bg-zinc-800/80 hover:bg-zinc-700/80 border-zinc-700/40";
    if (count === 1) return "bg-emerald-500 hover:bg-emerald-400 border-emerald-400 shadow-sm shadow-emerald-500/20";
    if (count === 2) return "bg-emerald-400 hover:bg-emerald-300 border-emerald-300 shadow-sm shadow-emerald-400/30";
    return "bg-amber-400 hover:bg-amber-300 border-amber-300 shadow-sm shadow-amber-400/40";
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
              {taskTitle} Activity Heatmap
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable 365-day verification log & streak consistency
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Completions</div>
            <div className="text-lg font-bold text-zinc-200">{totalCompletions} <span className="text-xs text-zinc-500">days</span></div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Current Streak</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center justify-end gap-1">
              <span>{currentStreak}</span>
              <span className="text-xs">🔥</span>
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Longest</div>
            <div className="text-lg font-bold text-amber-400">{longestStreak} <span className="text-xs text-zinc-500">days</span></div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="mt-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
        <div className="min-w-[760px]">
          {/* Month labels */}
          <div className="flex text-[11px] text-zinc-400 font-medium mb-2 pl-8 relative h-4">
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${m.colIndex * 15 + 32}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Day of week labels */}
            <div className="flex flex-col justify-between text-[10px] text-zinc-500 font-medium pr-1 select-none pt-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Grid Columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      title={`${format(day.date, "EEEE, MMMM do, yyyy")}: ${
                        day.count > 0 ? `${day.count} completion` : "No activity"
                      }`}
                      className={`w-[11px] h-[11px] rounded-[2.5px] border transition-transform duration-100 hover:scale-125 ${getColorClass(
                        day.count,
                        day.isFuture
                      )}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-zinc-400 mt-5 pt-3 border-t border-zinc-800/60">
            <span className="text-[11px] text-zinc-500">
              Evaluated strictly in your local timezone to prevent cheat clock shifts
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">Less</span>
              <div className="w-[11px] h-[11px] rounded-[2.5px] bg-zinc-800/80 border border-zinc-700/40" />
              <div className="w-[11px] h-[11px] rounded-[2.5px] bg-emerald-500 border border-emerald-400" />
              <div className="w-[11px] h-[11px] rounded-[2.5px] bg-emerald-400 border border-emerald-300" />
              <div className="w-[11px] h-[11px] rounded-[2.5px] bg-amber-400 border border-amber-300" />
              <span className="text-[11px] text-zinc-500">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

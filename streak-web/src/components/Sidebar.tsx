import React from 'react';
import {
  Flame,
  Globe,
  CheckCircle2,
  Layers,
  BellRing,
  BellOff
} from 'lucide-react';

interface User {
  id?: string;
  _id?: string;
  name?: string;
  email: string;
  timezone: string;
  notification?: string;
}

interface SidebarProps {
  user: User | null;
  tasksCount: number;
  completedTodayCount: number;
  timezones: string[];
  selectedTimezone: string;
  onTimezoneChange: (tz: string) => void;
  onToggleNotification: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  tasksCount,
  completedTodayCount,
  timezones,
  selectedTimezone,
  onTimezoneChange,
  onToggleNotification,
}) => {
  const isNotificationEnabled = user?.notification !== 'disabled';

  return (
    <aside className="w-72 flex-shrink-0 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 p-5 shadow-2xl backdrop-blur-xl z-20">
      {/* Top: App Branding & User Profile */}
      <div className="space-y-6">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              TaskStreak
            </h1>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-white tracking-tight truncate max-w-[200px]">
                {user?.name || 'User'}
              </div>
              
            </div>
            <div className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
              Live
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Overview
          </div>

          <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium text-sm">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4" />
              <span>Active Habits</span>
            </div>
            <span className="text-xs font-bold bg-orange-500/20 px-2 py-0.5 rounded-full">
              {tasksCount}
            </span>
          </div>

          <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 font-medium text-sm transition-colors">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Completed Today</span>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {completedTodayCount} / {tasksCount}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom: Settings Section (Pinned to bottom) */}
      <div className="pt-6 border-t border-slate-800/80 space-y-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
          Settings
        </div>

        {/* Timezone Selector */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            Active Timezone
          </label>
          <div className="relative">
            <select
              value={selectedTimezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              className="w-full appearance-none bg-slate-800/90 border border-slate-700/70 text-slate-200 text-xs rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-colors cursor-pointer"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Locks daily check-ins precisely at midnight in your region.
          </p>
        </div>

        {/* 8:00 PM Notifications Setting Toggle */}
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isNotificationEnabled ? (
              <BellRing className="w-4 h-4 text-orange-400" />
            ) : (
              <BellOff className="w-4 h-4 text-slate-400" />
            )}
            <div>
              <div className="text-xs font-semibold text-slate-200">8 PM Reminder</div>
              <div className="text-[10px] text-slate-400">
                {isNotificationEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
          <button
            onClick={onToggleNotification}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${isNotificationEnabled ? 'bg-orange-600' : 'bg-slate-700'
              }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isNotificationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
};

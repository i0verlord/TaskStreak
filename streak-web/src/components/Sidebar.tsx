import React from 'react';
import { 
  Flame, 
  Snowflake, 
  Globe, 
  LogOut, 
  LogIn, 
  UserCheck, 
  CheckCircle2, 
  Layers, 
  BellRing,
  BellOff
} from 'lucide-react';

interface User {
  id?: string;
  _id?: string;
  email: string;
  timezone: string;
  streak_freezes_available: number;
  notification?: string;
}

interface SidebarProps {
  user: User | null;
  tasksCount: number;
  completedTodayCount: number;
  timezones: string[];
  selectedTimezone: string;
  onTimezoneChange: (tz: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleNotification: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  tasksCount,
  completedTodayCount,
  timezones,
  selectedTimezone,
  onTimezoneChange,
  onOpenAuth,
  onLogout,
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
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              TaskStreak
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400">Cheat-proof habit tracker</p>
          </div>
        </div>

        {/* Profile Card (At Top) */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                {user?.email ? user.email[0].toUpperCase() : 'G'}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-semibold text-white truncate max-w-[130px]">
                  {user?.email ? user.email.split('@')[0] : 'Guest User'}
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                  {user?.email || 'Demo Session'}
                </div>
              </div>
            </div>

            {user?.email ? (
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                title="Sign In"
                className="p-1.5 text-orange-400 hover:text-orange-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Freeze Counter Badge */}
          <div className="flex items-center justify-between bg-slate-900/80 rounded-xl px-3 py-2 border border-slate-700/40">
            <div className="flex items-center gap-1.5">
              <Snowflake className="w-4 h-4 text-sky-400" />
              <span className="text-xs text-slate-300 font-medium">Streak Freezes</span>
            </div>
            <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
              {user?.streak_freezes_available ?? 2} Available
            </span>
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
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
              isNotificationEnabled ? 'bg-orange-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                isNotificationEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Account Action */}
        {!user?.email && (
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-orange-600/90 hover:bg-orange-500 text-white font-medium text-xs shadow-md transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Sign In / Register
          </button>
        )}
      </div>
    </aside>
  );
};

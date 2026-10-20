import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  CheckCircle2,
  Plus,
  Trash2,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { orpc } from '../lib/orpc';

interface Task {
  id: string;
  _id?: string;
  userId?: string;
  title: string;
  current_streak: number;
  longest_streak: number;
  completed_today: boolean;
  is_locked: boolean;
  last_completed_at?: string | Date;
  user_timezone?: string;
}

interface User {
  id?: string;
  _id?: string;
  name?: string;
  email: string;
  timezone: string;
  notification?: string;
}

const TIMEZONES = [
  'Asia/Calcutta',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
];

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message?: unknown }).message || 'An error occurred');
  }
  return String(err || 'An error occurred');
}

export const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => {
      setActionNotice(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orpc.tasks.list({});
      setTasks(res.tasks || []);
      if (res.user) setUser(res.user);

      if (res.tasks && res.tasks.length > 0) {
        setSelectedTaskId((prev) => prev || res.tasks[0].id);
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      console.warn('oRPC fetch error:', msg);
      setActionNotice(`⚠️ Unable to reach API server: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  // Mark task as done
  const handleMarkDone = async (task: Task) => {
    if (task.is_locked || submittingTaskId) return;

    setSubmittingTaskId(task.id);
    setActionNotice(null);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
            ...t,
            completed_today: true,
            is_locked: true,
            current_streak: t.current_streak + 1,
            longest_streak: Math.max(t.longest_streak, t.current_streak + 1),
          }
          : t
      )
    );

    try {
      const res = await orpc.tasks.log({ taskId: task.id });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fbbf24', '#10b981', '#38bdf8'],
      });

      setActionNotice(res.message);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setActionNotice(`⚠️ ${msg || 'Could not complete task'}`);
      fetchDashboardData();
    } finally {
      setSubmittingTaskId(null);
    }
  };

  // Add new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isCreatingTask) return;

    setIsCreatingTask(true);
    try {
      const res = await orpc.tasks.create({ title: newTaskTitle.trim() });
      setNewTaskTitle('');
      setTasks((prev) => [...prev, res.task]);
      if (!selectedTaskId) setSelectedTaskId(res.task.id);
      setActionNotice(`✅ Created habit "${res.task.title}"`);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setActionNotice(`⚠️ ${msg || 'Failed to create task'}`);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Start editing task
  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  // Save edited task title
  const handleSaveEdit = async (taskId: string) => {
    if (!editingTitle.trim() || isUpdatingTask) return;

    setIsUpdatingTask(true);
    try {
      await orpc.tasks.update({ taskId, title: editingTitle.trim() });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, title: editingTitle.trim() } : t))
      );
      setEditingTaskId(null);
      setActionNotice(` Renamed to "${editingTitle.trim()}"`);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setActionNotice(`⚠️ ${msg || 'Failed to update habit'}`);
    } finally {
      setIsUpdatingTask(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will delete all its streak history.`)) {
      return;
    }

    try {
      await orpc.tasks.delete({ taskId });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTaskId === taskId) {
        const remaining = tasks.filter((t) => t.id !== taskId);
        setSelectedTaskId(remaining.length > 0 ? remaining[0].id : null);
      }
      setActionNotice(`🗑️ Deleted habit "${title}"`);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setActionNotice(`⚠️ ${msg || 'Failed to delete habit'}`);
    }
  };

  // Change timezone
  const handleTimezoneChange = async (newTz: string) => {
    if (user) {
      setUser({ ...user, timezone: newTz });
    }
    try {
      await orpc.user.update({ timezone: newTz });
      fetchDashboardData();
      setActionNotice(`🌐 Timezone updated to ${newTz}`);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setActionNotice(`⚠️ ${msg || 'Could not update timezone'}`);
    }
  };

  // Toggle notification
  const handleToggleNotification = async () => {
    const nextStatus = user?.notification === 'disabled' ? 'enabled' : 'disabled';
    if (user) {
      setUser({ ...user, notification: nextStatus });
    }
    try {
      await orpc.user.update({ notification: nextStatus });
      setActionNotice(`🔔 8:00 PM reminders ${nextStatus}`);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setActionNotice(`⚠️ ${msg || 'Could not update notification setting'}`);
    }
  };

  const completedTodayCount = tasks.filter((t) => t.completed_today).length;

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100">
      {/* Permanent Side Navigation Bar (Always open, No header on top) */}
      <Sidebar
        user={user}
        tasksCount={tasks.length}
        completedTodayCount={completedTodayCount}
        timezones={TIMEZONES}
        selectedTimezone={user?.timezone || 'Asia/Calcutta'}
        onTimezoneChange={handleTimezoneChange}
        onToggleNotification={handleToggleNotification}
      />

      {/* Fluid Main Content */}
      <main className="flex-1 flex flex-col min-w-0 p-6 lg:p-10 space-y-8 overflow-y-auto">
            {/* 1. Active Habits Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-white tracking-tight">Active Habits</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Making healthy habits everyday
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-medium">
                  Completed Today:{' '}
                  <span className="font-bold text-emerald-400">
                    {completedTodayCount} / {tasks.length}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Add Task Bar (Directly below Active Habits Header Bar) */}
            <form onSubmit={handleCreateTask} className="w-full">
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-2 shadow-lg focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                <div className="pl-3 text-slate-400">
                  <Plus className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a new habit (e.g. Read 20 pages, Morning 5km Run, LeetCode problem)..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none px-2"
                />
                <button
                  type="submit"
                  disabled={isCreatingTask || !newTaskTitle.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold text-xs shadow-md shadow-orange-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingTask ? 'Adding...' : 'Add Habit'}</span>
                </button>
              </div>
            </form>

            {/* 3. Habit Cards Grid */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Your Daily Trackers
                </h3>
                <span className="text-[11px] text-slate-400">
                  Track and maintain your streaks every day
                </span>
              </div>

              {loading && tasks.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-44 rounded-2xl bg-slate-800/30 border border-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-16 px-6 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 backdrop-blur-sm max-w-lg mx-auto space-y-4 shadow-xl">
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-5xl shadow-inner select-none">
                    🤔
                  </div>
                  <h4 className="text-lg font-bold text-white tracking-tight">No tasks here yet...</h4>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Let's start building healthy habits!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {tasks.map((task) => {
                    const isSelected = selectedTaskId === task.id;
                    const isEditing = editingTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`relative rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${isSelected
                            ? 'bg-slate-800/90 border-orange-500/60 shadow-xl shadow-orange-500/10 ring-1 ring-orange-500/30'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700/80 hover:bg-slate-850 shadow-md'
                          }`}
                      >
                        {/* Card Top: Title, Edit & Delete Buttons */}
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="flex-1 bg-slate-800 border border-orange-500/50 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(task.id);
                                    if (e.key === 'Escape') setEditingTaskId(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveEdit(task.id)}
                                  disabled={isUpdatingTask}
                                  className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                                  title="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingTaskId(null)}
                                  className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <h4 className="text-base font-bold text-white tracking-tight line-clamp-2 flex-1">
                                {task.title}
                              </h4>
                            )}

                            {/* Edit & Delete Actions */}
                            {!isEditing && (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleStartEdit(task)}
                                  title="Edit habit name"
                                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id, task.title)}
                                  title="Delete habit from database"
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Streak Counters */}
                          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-850">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xl">🔥</span>
                              <div>
                                <div className="text-xs text-slate-400 font-medium">Current</div>
                                <div className="text-base font-black text-orange-400">
                                  {task.current_streak} <span className="text-xs font-medium text-slate-400">days</span>
                                </div>
                              </div>
                            </div>

                            <div className="h-6 w-px bg-slate-800" />

                            <div>
                              <div className="text-xs text-slate-400 font-medium">Longest</div>
                              <div className="text-base font-bold text-amber-400">
                                {task.longest_streak} <span className="text-xs font-medium text-slate-400">days</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom: Action Button (Locked if done today) */}
                        <div className="mt-5 pt-3 border-t border-slate-850">
                          {task.completed_today || task.is_locked ? (
                            <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center gap-2 text-xs font-bold cursor-not-allowed">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Done for Today (Locked)</span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkDone(task);
                              }}
                              disabled={submittingTaskId === task.id}
                              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                            >
                              <Flame className="w-4 h-4" />
                              <span>
                                {submittingTaskId === task.id ? 'Updating...' : 'Mark as Done Today'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
      </main>

      {/* Floating Bottom-Right Notification Pop-up */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/95 border border-orange-500/40 text-orange-200 text-xs font-semibold shadow-2xl shadow-orange-950/50 backdrop-blur-md animate-in slide-in-from-bottom-5 max-w-md">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🔔</span>
            <span className="leading-snug">{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};


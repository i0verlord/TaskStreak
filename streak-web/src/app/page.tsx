"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Heatmap, TaskLog } from "@/components/Heatmap";
import { 
  Flame, 
  CheckCircle2, 
  Plus, 
  Snowflake, 
  Globe, 
  RefreshCw, 
  Calendar,
  Lock,
  Sparkles,
  Award
} from "lucide-react";

interface Task {
  id: number;
  user_id: number;
  title: string;
  current_streak: number;
  longest_streak: number;
  completed_today: boolean;
  is_locked: boolean;
  last_completed_at?: string;
  user_timezone?: string;
}

interface User {
  id: number;
  email: string;
  timezone: string;
  streak_freezes_available: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const TIMEZONES = [
  "Asia/Calcutta",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User>({
    id: 1,
    email: "alex@taskstreak.dev",
    timezone: "Asia/Calcutta",
    streak_freezes_available: 2,
  });
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isSubmittingTaskId, setIsSubmittingTaskId] = useState<number | null>(null);

  // Fetch tasks and user details
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/tasks?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to connect to API");
      const data = await res.json();
      setTasks(data.tasks || []);
      if (data.user) setUser(data.user);
      if (data.tasks?.length > 0 && selectedTaskId === null) {
        setSelectedTaskId(data.tasks[0].id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "API offline";
      console.warn("API unreachable, operating in demo preview mode:", msg);
      // Fallback local tasks for instant preview
      setTasks([
        {
          id: 1,
          user_id: 1,
          title: "Study Java & Data Structures",
          current_streak: 14,
          longest_streak: 21,
          completed_today: false,
          is_locked: false,
        },
        {
          id: 2,
          user_id: 1,
          title: "Morning 5km Run",
          current_streak: 5,
          longest_streak: 12,
          completed_today: false,
          is_locked: false,
        },
        {
          id: 3,
          user_id: 1,
          title: "Read 20 Pages",
          current_streak: 0,
          longest_streak: 8,
          completed_today: false,
          is_locked: false,
        },
      ]);
      setSelectedTaskId(1);
    } finally {
      setLoading(false);
    }
  }, [user.id, selectedTaskId]);

  // Fetch logs for the selected task (for heatmap)
  const fetchLogsForTask = useCallback(async (taskId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/logs`);
      if (res.ok) {
        const data = await res.json();
        setTaskLogs(data.logs || []);
        return;
      }
    } catch {
      // Mock logs fallback
    }

    // Generate mock logs for offline preview
    const now = new Date();
    const mockLogs: TaskLog[] = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      mockLogs.push({ id: i, task_id: taskId, completed_at: d.toISOString() });
    }
    for (let i = 20; i <= 60; i += 2) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      mockLogs.push({ id: 100 + i, task_id: taskId, completed_at: d.toISOString() });
    }
    setTaskLogs(mockLogs);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (selectedTaskId !== null) {
      fetchLogsForTask(selectedTaskId);
    }
  }, [selectedTaskId, fetchLogsForTask]);

  // Handle clicking "Done" with Optimistic UI updates
  const handleMarkDone = async (task: Task) => {
    if (task.completed_today || task.is_locked) {
      return;
    }

    setIsSubmittingTaskId(task.id);

    // Optimistically update task
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              current_streak: t.current_streak + 1,
              longest_streak: Math.max(t.longest_streak, t.current_streak + 1),
              completed_today: true,
              is_locked: true,
            }
          : t
      )
    );

    // Trigger celebratory confetti animation
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#f97316", "#eab308", "#10b981", "#3b82f6"],
      });
    } catch {
      // Confetti fallback
    }

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        // Rollback optimistic update
        setTasks(previousTasks);
        setActionNotice(`Notice: ${data.error || "Could not log completion"}`);
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        setActionNotice(data.message || "Streak updated! 🔥");
        setTimeout(() => setActionNotice(null), 4000);
        // Refresh logs for heatmap
        if (selectedTaskId === task.id) {
          fetchLogsForTask(task.id);
        }
      }
    } catch {
      // If API fails, keep optimistic state in local preview mode
      setActionNotice("Offline demo mode: Streak incremented locally! 🔥");
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setIsSubmittingTaskId(null);
    }
  };

  // Handle updating user timezone
  const handleTimezoneChange = async (newTz: string) => {
    setUser((prev) => ({ ...prev, timezone: newTz }));
    try {
      await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: newTz }),
      });
      fetchDashboardData();
    } catch {
      // Handled silently
    }
  };

  // Handle adding new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle.trim(), userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [...prev, data.task]);
      } else {
        // Fallback local create
        const newTask: Task = {
          id: Date.now(),
          user_id: user.id,
          title: newTaskTitle.trim(),
          current_streak: 0,
          longest_streak: 0,
          completed_today: false,
          is_locked: false,
        };
        setTasks((prev) => [...prev, newTask]);
      }
    } catch {
      const newTask: Task = {
        id: Date.now(),
        user_id: user.id,
        title: newTaskTitle.trim(),
        current_streak: 0,
        longest_streak: 0,
        completed_today: false,
        is_locked: false,
      };
      setTasks((prev) => [...prev, newTask]);
    }

    setNewTaskTitle("");
    setIsCreatingTask(false);
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500 selection:text-white">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Flame className="w-6 h-6 text-zinc-950 fill-zinc-950" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">
                TaskStreak
              </span>
              <span className="text-[10px] text-zinc-500 block -mt-1 font-mono">
                Cross-Platform Habit Engine
              </span>
            </div>
          </div>

          {/* User Controls: Timezone & Streak Freezes */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Freezes badge */}
            <div 
              title="Streak Freezes protect your streak if you miss 1 day"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 text-xs font-semibold"
            >
              <Snowflake className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{user.streak_freezes_available} Freezes</span>
            </div>

            {/* Timezone picker */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={user.timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="bg-transparent border-none text-zinc-200 font-medium text-xs focus:outline-none cursor-pointer"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} className="bg-zinc-900 text-zinc-200">
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchDashboardData}
              title="Refresh Tasks"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Alert if any notice */}
        {actionNotice && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-950/70 to-amber-950/70 border border-orange-500/40 text-orange-200 text-sm flex items-center justify-between shadow-lg shadow-orange-500/10 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-zinc-400 hover:text-zinc-200 text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Title & Create Task Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Today&apos;s Habits & Tasks
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Timezone: <span className="text-zinc-300 font-mono">{user.timezone}</span> • Server UTC verification active
            </p>
          </div>

          <button
            onClick={() => setIsCreatingTask(!isCreatingTask)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm transition shadow-lg shadow-orange-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Task</span>
          </button>
        </div>

        {/* Create Task Form */}
        {isCreatingTask && (
          <form
            onSubmit={handleCreateTask}
            className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row gap-3 items-center animate-in fade-in"
          >
            <input
              type="text"
              placeholder="e.g., Study System Design, LeetCode Problem, Read 10 Pages..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500 transition"
              autoFocus
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition"
              >
                Add Task
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingTask(false)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => {
            const isDoneToday = task.completed_today || task.is_locked;
            const isSelected = selectedTaskId === task.id;
            const isSubmitting = isSubmittingTaskId === task.id;

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`group relative rounded-2xl p-6 transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? "bg-zinc-900 border-orange-500/60 shadow-xl shadow-orange-500/10 ring-1 ring-orange-500/40"
                    : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                {/* Top Badge: Streak Counter with Fire Emoji */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-zinc-100 group-hover:text-white transition">
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        Best: {task.longest_streak}d
                      </span>
                    </div>
                  </div>

                  {/* Fire Streak Badge */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-sm transition-transform group-hover:scale-105 ${
                      task.current_streak > 0
                        ? "bg-orange-950/60 border-orange-500/50 text-orange-400 shadow-sm shadow-orange-500/20"
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-400"
                    }`}
                  >
                    <span className="text-base animate-bounce">🔥</span>
                    <span>{task.current_streak}</span>
                  </div>
                </div>

                {/* Bottom Section: Action Button */}
                <div className="mt-8 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                    {isDoneToday ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Done for today</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <span>Ready to complete</span>
                      </>
                    )}
                  </span>

                  {/* The "Done" Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkDone(task);
                    }}
                    disabled={isDoneToday || isSubmitting}
                    className={`relative px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
                      isDoneToday
                        ? "bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                        : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 shadow-md shadow-orange-500/25 active:scale-95"
                    }`}
                  >
                    {isDoneToday ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isSubmitting ? "Saving..." : "Done"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* GitHub-style Contribution Heatmap Section */}
        {selectedTask && (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                <span>Streak Consistency & Heatmap</span>
              </h2>
              <span className="text-xs text-zinc-400">
                Viewing: <strong className="text-orange-400">{selectedTask.title}</strong>
              </span>
            </div>

            <Heatmap
              logs={taskLogs}
              taskTitle={selectedTask.title}
              currentStreak={selectedTask.current_streak}
              longestStreak={selectedTask.longest_streak}
            />
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export interface Task {
  id: number | string;
  _id?: string;
  user_id?: number | string;
  userId?: number | string;
  title: string;
  current_streak: number;
  longest_streak: number;
  completed_today: boolean;
  is_locked: boolean;
  last_completed_at?: string | null;
}

export interface User {
  id: number | string;
  _id?: string;
  name?: string;
  email: string;
  timezone: string;
  expo_push_token?: string | null;
  notification?: 'enabled' | 'disabled';
}

// Development default host: Android emulator uses 10.0.2.2, iOS/Web uses localhost
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL = `http://${DEFAULT_HOST}:5000/api`;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>({
    id: '6ad73b45cdecdb457e0973f9',
    name: 'Admin',
    email: 'admin@taskstreak.dev',
    timezone: 'Asia/Calcutta',
    notification: 'enabled',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/tasks`);
      if (!res.ok) throw new Error('API unreachable');
      const data = await res.json();
      setTasks(data.tasks || []);
      if (data.user) setUser(data.user);
    } catch (err: any) {
      console.log('[useTasks] API unreachable, using local fallback state:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);



  // Optimistic UI Update for clicking "Done"
  const markDone = async (task: Task) => {
    if (task.completed_today || task.is_locked || !user) {
      return;
    }

    const prevTasks = [...tasks];

    // Optimistically update: +1 streak, locked immediately
    setTasks((current) =>
      current.map((t) =>
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

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTasks(prevTasks);
        setNotice(data.error || 'Could not mark task as done');
      } else {
        setNotice(data.message || 'Streak increased! 🔥');
      }
    } catch {
      setNotice('Offline Demo Mode: Streak incremented locally! 🔥');
    }
  };

  const addTask = async (title: string) => {
    if (!title.trim() || !user) return;

    const newTask: Task = {
      id: Date.now().toString(),
      user_id: user.id,
      title: title.trim(),
      current_streak: 0,
      longest_streak: 0,
      completed_today: false,
      is_locked: false,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), userId: user.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [...prev, data.task]);
        setNotice('Task added! ✨');
      } else {
        const data = await res.json();
        setNotice(data.error || 'Failed to add task');
        setTasks((prev) => [...prev, newTask]);
      }
    } catch {
      setTasks((prev) => [...prev, newTask]);
      setNotice('Offline Demo Mode: Task created locally!');
    }
  };

  const updateTask = async (taskId: number | string, newTitle: string) => {
    if (!newTitle.trim() || !user) return;

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, title: newTitle.trim() } : t))
    );

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), userId: user.id }),
      });
      if (res.ok) {
        setNotice('Task renamed! ✏️');
      }
    } catch {
      setNotice('Offline Demo Mode: Task renamed locally! ✏️');
    }
  };

  const deleteTask = async (taskId: number | string) => {
    if (!user) return;
    const prevTasks = [...tasks];
    setTasks((current) => current.filter((t) => t.id !== taskId));

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        setNotice('Task permanently deleted from database. 🗑️');
      } else {
        setTasks(prevTasks);
        setNotice('Failed to delete task');
      }
    } catch {
      setNotice('Offline Demo Mode: Task deleted locally!');
    }
  };

  const updateUserSetting = async (updates: Partial<User>) => {
    if (!user) return;
    setUser((prev) => (prev ? { ...prev, ...updates } : null));

    try {
      await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {}
  };

  return {
    tasks,
    user,
    setUser,
    loading,
    notice,
    setNotice,
    refreshTasks: fetchTasks,
    markDone,
    addTask,
    updateTask,
    deleteTask,
    updateUserSetting,
  };
}


import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { isTaskCompletedToday } from '../utils/dateMath';

export interface Task {
  id: number;
  user_id: number;
  title: string;
  current_streak: number;
  longest_streak: number;
  completed_today: boolean;
  is_locked: boolean;
  last_completed_at?: string | null;
}

export interface User {
  id: number;
  email: string;
  timezone: string;
  streak_freezes_available: number;
  expo_push_token?: string | null;
}

// Development default host: Android emulator uses 10.0.2.2, iOS/Web uses localhost
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL = `http://${DEFAULT_HOST}:5000/api`;

export function useTasks(userId: number = 1) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User>({
    id: userId,
    email: 'alex@taskstreak.dev',
    timezone: 'Asia/Calcutta',
    streak_freezes_available: 2,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/tasks?userId=${userId}`);
      if (!res.ok) throw new Error('API unreachable');
      const data = await res.json();
      setTasks(data.tasks || []);
      if (data.user) setUser(data.user);
    } catch (err: any) {
      console.log('[useTasks] API unreachable, using local fallback state:', err.message);
      // Fallback state
      setTasks([
        {
          id: 1,
          user_id: userId,
          title: 'Study Java & Data Structures',
          current_streak: 14,
          longest_streak: 21,
          completed_today: false,
          is_locked: false,
        },
        {
          id: 2,
          user_id: userId,
          title: 'Morning 5km Run',
          current_streak: 5,
          longest_streak: 12,
          completed_today: false,
          is_locked: false,
        },
        {
          id: 3,
          user_id: userId,
          title: 'Read 20 Pages',
          current_streak: 0,
          longest_streak: 8,
          completed_today: false,
          is_locked: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Optimistic UI Update for clicking "Done"
  const markDone = async (task: Task) => {
    if (task.completed_today || task.is_locked) {
      return;
    }

    // Save previous snapshot in case rollback is needed
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
      });

      const data = await res.json();

      if (!res.ok) {
        // Rollback optimistic update
        setTasks(prevTasks);
        setNotice(data.error || 'Could not mark task as done');
      } else {
        setNotice(data.message || 'Streak increased! 🔥');
      }
    } catch (err: any) {
      // In offline preview mode, maintain the optimistic update
      setNotice('Offline Demo Mode: Streak incremented locally! 🔥');
    }
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
  };
}

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { format, subDays, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

export interface TaskLog {
  id: number;
  task_id: number;
  completed_at: string;
}

interface HeatmapProps {
  logs: TaskLog[];
  taskTitle: string;
  currentStreak: number;
  longestStreak: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ logs, taskTitle, currentStreak, longestStreak }) => {
  const { weeks, totalCompletions } = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, 364), { weekStartsOn: 0 });
    
    const dateCounts = new Map<string, number>();
    logs.forEach((log) => {
      try {
        const d = typeof log.completed_at === "string" ? parseISO(log.completed_at) : new Date(log.completed_at);
        const key = format(d, "yyyy-MM-dd");
        dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
      } catch {}
    });

    const weeksArray = [];
    let cursorDate = startDate;
    for (let w = 0; w < 53; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(cursorDate);
        const dateStr = format(dateObj, "yyyy-MM-dd");
        const count = dateCounts.get(dateStr) || 0;
        const isFuture = dateObj > today && !isSameDay(dateObj, today);

        weekDays.push({ dateObj, count, isFuture });
        cursorDate = addDays(cursorDate, 1);
      }
      weeksArray.push(weekDays);
    }
    return { weeks: weeksArray, totalCompletions: logs.length };
  }, [logs]);

  const getColor = (count: number, isFuture: boolean) => {
    if (isFuture) return 'rgba(39, 39, 42, 0.3)'; // zinc-800 low opacity
    if (count === 0) return '#27272a'; // zinc-800
    if (count === 1) return '#10b981'; // emerald-500
    if (count === 2) return '#34d399'; // emerald-400
    return '#fbbf24'; // amber-400
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{taskTitle} Heatmap</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Completions</Text>
          <Text style={styles.statValue}>{totalCompletions}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={[styles.statValue, { color: '#34d399' }]}>{currentStreak} 🔥</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Best</Text>
          <Text style={[styles.statValue, { color: '#fbbf24' }]}>{longestStreak}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {weeks.map((week, wIdx) => (
          <View key={wIdx} style={styles.column}>
            {week.map((day, dIdx) => (
              <View
                key={dIdx}
                style={[
                  styles.cell,
                  { backgroundColor: getColor(day.count, day.isFuture) }
                ]}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f4f4f5',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#71717a',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f4f4f5',
  },
  scrollContent: {
    paddingRight: 16,
  },
  column: {
    flexDirection: 'column',
    marginRight: 4,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginBottom: 4,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTasks, Task } from '../hooks/useTasks';
import { TaskCard } from '../components/TaskCard';
import { Heatmap } from '../components/Heatmap';

export const DashboardScreen = ({ navigation }: any) => {
  const { tasks, user, loading, notice, setNotice, refreshTasks, markDone } = useTasks();

  // Pick the first task as active to show its Heatmap (or you could add a state to track selected task)
  const [selectedTaskId, setSelectedTaskId] = React.useState<number | null>(null);
  
  React.useEffect(() => {
    if (tasks.length > 0 && selectedTaskId === null) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];

  // For heatmap, we'll mock logs if the API doesn't fetch them, since we need an endpoint.
  // We can just use an empty array or fetch them if useTasks returns logs, but for now
  // let's create some dummy logs to show the Heatmap works beautifully.
  const [mockLogs, setMockLogs] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!selectedTask) return;
    const logs = [];
    const now = new Date();
    for (let i = 1; i <= selectedTask.current_streak; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      logs.push({ id: i, task_id: selectedTask.id, completed_at: d.toISOString() });
    }
    setMockLogs(logs);
  }, [selectedTask]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshTasks}
            tintColor="#ea580c"
          />
        }
      >
        {/* Top Status & Freeze Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appTitle}>TaskStreak <Text style={{fontSize: 18}}>🚀</Text></Text>
            <Text style={styles.timezoneBadge}>
              Timezone: {user.timezone}
            </Text>
          </View>

          <View style={styles.topRight}>
            <View style={styles.freezeBadge}>
              <Text style={styles.freezeEmoji}>❄️</Text>
              <Text style={styles.freezeText}>
                {user.streak_freezes_available} Freezes
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Settings', { user })}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Temporary Notice Banner */}
        {notice && (
          <TouchableOpacity
            onPress={() => setNotice(null)}
            style={styles.noticeBanner}
          >
            <Text style={styles.noticeText}>✨ {notice}</Text>
          </TouchableOpacity>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Habit Checklist</Text>
          <Text style={styles.sectionSubtitle}>
            Complete your habits to keep your streak burning
          </Text>
        </View>

        {/* Task Cards */}
        {tasks.map((task: Task) => (
          <TouchableOpacity 
            key={task.id} 
            onPress={() => setSelectedTaskId(task.id)}
            activeOpacity={0.9}
          >
            <TaskCard 
              task={task} 
              onDone={markDone} 
              isSelected={selectedTaskId === task.id} 
            />
          </TouchableOpacity>
        ))}

        {/* Selected Task Heatmap */}
        {selectedTask && (
          <Heatmap 
            logs={mockLogs} 
            taskTitle={selectedTask.title} 
            currentStreak={selectedTask.current_streak} 
            longestStreak={selectedTask.longest_streak} 
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  timezoneBadge: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
    fontFamily: 'System',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  freezeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 47, 73, 0.6)',
    borderColor: 'rgba(2, 132, 199, 0.5)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  freezeEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  freezeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
  },
  settingsButton: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  settingsIcon: {
    fontSize: 18,
  },
  noticeBanner: {
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
    borderColor: '#ea580c',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
  },
  noticeText: {
    color: '#ffedd5',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f4f4f5',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 4,
    fontWeight: '500',
  },
});

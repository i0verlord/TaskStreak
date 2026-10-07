import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useTasks, Task } from '../hooks/useTasks';
import { TaskCard } from '../components/TaskCard';
import { Heatmap } from '../components/Heatmap';

export const DashboardScreen = ({ navigation }: any) => {
  const { tasks, user, loading, notice, setNotice, refreshTasks, markDone, addTask, deleteTask } = useTasks();

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  useEffect(() => {
    if (tasks.length > 0 && selectedTaskId === null) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];

  const [mockLogs, setMockLogs] = useState<any[]>([]);

  useEffect(() => {
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

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle);
      setNewTaskTitle('');
      setIsCreating(false);
    }
  };

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
            <Text style={styles.appTitle}>TaskStreak <Text style={{ fontSize: 18 }}>🚀</Text></Text>
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
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Today's Checklist</Text>
            <Text style={styles.sectionSubtitle}>
              Complete your habits to keep your streak
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsCreating(!isCreating)}
          >
            <Text style={styles.addButtonText}>
              {isCreating ? 'Cancel' : '+ Add'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Task Form */}
        {isCreating && (
          <View style={styles.createTaskContainer}>
            <TextInput
              style={styles.createTaskInput}
              placeholder="e.g., Read 10 Pages..."
              placeholderTextColor="#71717a"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
              onSubmitEditing={handleCreateTask}
            />
            <TouchableOpacity
              style={[styles.createTaskButton, !newTaskTitle.trim() && { opacity: 0.5 }]}
              onPress={handleCreateTask}
              disabled={!newTaskTitle.trim()}
            >
              <Text style={styles.createTaskButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        )}

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
              onDelete={deleteTask}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
    borderWidth: 1,
    borderColor: '#ea580c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createTaskContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  createTaskInput: {
    flex: 1,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f4f4f5',
    fontSize: 15,
  },
  createTaskButton: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  createTaskButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

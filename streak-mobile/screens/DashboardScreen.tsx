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
  Modal,
} from 'react-native';
import { useTasks, Task } from '../hooks/useTasks';
import { TaskCard } from '../components/TaskCard';
import { SidebarDrawer } from '../components/SidebarDrawer';

export const DashboardScreen = ({ navigation }: any) => {
  const {
    tasks,
    user,
    loading,
    notice,
    setNotice,
    refreshTasks,
    markDone,
    addTask,
    updateTask,
    deleteTask,
    updateUserSetting,
  } = useTasks();

  const [selectedTaskId, setSelectedTaskId] = useState<number | string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Edit task state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  useEffect(() => {
    if (tasks.length > 0 && selectedTaskId === null) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle);
      setNewTaskTitle('');
      setIsCreating(false);
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTask(task);
    setEditingTitle(task.title);
  };

  const handleSaveEdit = () => {
    if (editingTask && editingTitle.trim()) {
      updateTask(editingTask.id, editingTitle.trim());
      setEditingTask(null);
      setEditingTitle('');
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
        {/* Top Status Bar (App Branding + Settings Button) */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appTitle}>TaskStreak <Text style={{ fontSize: 22 }}>💪</Text></Text>
          </View>

          <View style={styles.topRight}>
            <TouchableOpacity
              onPress={() => setIsDrawerOpen(true)}
              style={styles.settingsButton}
              accessibilityLabel="Open settings and navigation drawer"
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Active Habits</Text>
                <Text style={styles.sectionSubtitle}>
                  Making healthy habits everyday
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

            {/* 0 Tasks: Thinking Emoji Graphic State */}
            {tasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.thinkingEmojiContainer}>
                  <Text style={styles.thinkingEmoji}>🤔</Text>
                </View>
                <Text style={styles.emptyTitle}>No tasks here yet...</Text>
                <Text style={styles.emptySubtitle}>
                  Let's start building healthy habits!
                </Text>
              </View>
            ) : (
              tasks.map((task: Task) => (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => setSelectedTaskId(task.id)}
                  activeOpacity={0.9}
                >
                  <TaskCard
                    task={task}
                    onDone={markDone}
                    onEdit={handleStartEdit}
                    onDelete={deleteTask}
                    isSelected={selectedTaskId === task.id}
                  />
                </TouchableOpacity>
              ))
            )}
      </ScrollView>


      {/* Edit Task Modal */}
      <Modal
        visible={editingTask !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingTask(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Habit Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editingTitle}
              onChangeText={setEditingTitle}
              placeholder="Habit title..."
              placeholderTextColor="#71717a"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditingTask(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, !editingTitle.trim() && { opacity: 0.5 }]}
                onPress={handleSaveEdit}
                disabled={!editingTitle.trim()}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Side Navigation Drawer (Settings Modal) */}
      <SidebarDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        tasks={tasks}
        onTimezoneChange={(tz) => updateUserSetting({ timezone: tz })}
        onToggleNotification={(enabled) =>
          updateUserSetting({ notification: enabled ? 'enabled' : 'disabled' })
        }
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  timezoneBadge: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
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
    backgroundColor: '#0E162A',
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
    backgroundColor: '#151F2F',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#27272a',
  },
  modalCancelText: {
    color: '#a1a1aa',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#ea580c',
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#0C1220',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#27272a',
    borderRadius: 24,
    marginVertical: 12,
  },
  thinkingEmojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#192337',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  thinkingEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});


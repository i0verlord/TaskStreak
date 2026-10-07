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

export const DashboardScreen = ({ navigation }: any) => {
  const { tasks, user, loading, notice, setNotice, refreshTasks, markDone } = useTasks();

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
            <Text style={styles.appTitle}>TaskStreak 🔥</Text>
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
            <Text style={styles.noticeText}>{notice}</Text>
          </TouchableOpacity>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Habit Checklist</Text>
          <Text style={styles.sectionSubtitle}>
            Button locks automatically once completed for today
          </Text>
        </View>

        {/* Task Cards */}
        {tasks.map((task: Task) => (
          <TaskCard key={task.id} task={task} onDone={markDone} />
        ))}
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
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
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
    gap: 8,
  },
  freezeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#082f49',
    borderColor: '#0284c7',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  freezeEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  freezeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  settingsIcon: {
    fontSize: 16,
  },
  noticeBanner: {
    backgroundColor: 'rgba(234, 88, 12, 0.2)',
    borderColor: '#ea580c',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  noticeText: {
    color: '#ffedd5',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
});

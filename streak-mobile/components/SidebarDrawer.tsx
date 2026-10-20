import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { User, Task } from '../hooks/useTasks';

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  tasks: Task[];
  onTimezoneChange: (tz: string) => void;
  onToggleNotification: (enabled: boolean) => void;
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

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  visible,
  onClose,
  user,
  tasks,
  onTimezoneChange,
  onToggleNotification,
}) => {
  const completedTodayCount = tasks.filter((t) => t.completed_today || t.is_locked).length;
  const isNotificationEnabled = user?.notification !== 'disabled';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <SafeAreaView style={styles.drawerContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header: Branding & Close */}
            <View style={styles.header}>
              <View style={styles.branding}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoEmoji}>🔥</Text>
                </View>
                <View>
                  <View style={styles.brandTitleRow}>
                    <Text style={styles.brandTitle}>TaskStreak</Text>
                    <View style={styles.proBadge}>
                      <Text style={styles.proText}>PRO</Text>
                    </View>
                  </View>
                  <Text style={styles.brandSubtitle}>Cheat-proof habit tracker</Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Card (Top: Single User Synced with Web) */}
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.name || 'Admin'}
                </Text>
                <View style={styles.sessionStatus}>
                  <View style={styles.activeDot} />
                  <Text style={styles.sessionText}>
                    Synced with Web
                  </Text>
                </View>
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            </View>

            {/* Overview Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Overview</Text>

              <View style={styles.statPillActive}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statIcon}>📋</Text>
                  <Text style={styles.statActiveTitle}>Active Habits</Text>
                </View>
                <View style={styles.statCountBadge}>
                  <Text style={styles.statCountText}>{tasks.length}</Text>
                </View>
              </View>

              <View style={styles.statPillCompleted}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statIcon}>✅</Text>
                  <Text style={styles.statCompletedTitle}>Completed Today</Text>
                </View>
                <View style={styles.statCompletedBadge}>
                  <Text style={styles.statCompletedBadgeText}>
                    {completedTodayCount} / {tasks.length}
                  </Text>
                </View>
              </View>
            </View>

            {/* Settings Section: Timezone */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Active Timezone</Text>
              <Text style={styles.sectionDesc}>
                Locks daily streak windows precisely at midnight.
              </Text>

              <View style={styles.tzGrid}>
                {TIMEZONES.map((tz) => {
                  const isSelected = user?.timezone === tz;
                  return (
                    <TouchableOpacity
                      key={tz}
                      onPress={() => onTimezoneChange(tz)}
                      style={[styles.tzChip, isSelected && styles.tzChipSelected]}
                    >
                      <Text
                        style={[styles.tzChipText, isSelected && styles.tzChipTextSelected]}
                        numberOfLines={1}
                      >
                        {tz.replace('_', ' ')}
                      </Text>
                      {isSelected && <Text style={styles.tzChipCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Settings Section: 8 PM Push Notification Toggle */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Notifications</Text>
              <View style={styles.toggleCard}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.toggleTitle}>
                    {isNotificationEnabled ? '🔔 8:00 PM Reminder' : '🔕 Reminders Paused'}
                  </Text>
                  <Text style={styles.toggleSubtitle}>
                    {isNotificationEnabled
                      ? 'Push alert if any habit is uncompleted'
                      : 'All reminder alerts muted'}
                  </Text>
                </View>
                <Switch
                  value={isNotificationEnabled}
                  onValueChange={onToggleNotification}
                  trackColor={{ false: '#27272a', true: '#ea580c' }}
                  thumbColor={isNotificationEnabled ? '#ffffff' : '#71717a'}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: '84%',
    maxWidth: 360,
    backgroundColor: '#09090b',
    borderLeftWidth: 1,
    borderLeftColor: '#27272a',
    height: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 20,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
  },
  proBadge: {
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.3)',
  },
  proText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fb923c',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 1,
  },
  closeButton: {
    padding: 6,
  },
  closeIcon: {
    fontSize: 18,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  profileInfo: {
    flex: 1,
    marginRight: 12,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  sessionText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  liveBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionDesc: {
    fontSize: 11,
    color: '#71717a',
    marginBottom: 10,
  },
  statPillActive: {
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statPillCompleted: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    fontSize: 14,
  },
  statActiveTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fb923c',
  },
  statCompletedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d4d4d8',
  },
  statCountBadge: {
    backgroundColor: 'rgba(234, 88, 12, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fb923c',
  },
  statCompletedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statCompletedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34d399',
  },
  tzGrid: {
    gap: 6,
  },
  tzChip: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tzChipSelected: {
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    borderColor: '#ea580c',
  },
  tzChipText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  tzChipTextSelected: {
    color: '#fb923c',
    fontWeight: '700',
  },
  tzChipCheck: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: '800',
  },
  toggleCard: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
});

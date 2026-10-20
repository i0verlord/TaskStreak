import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { API_BASE_URL } from '../hooks/useTasks';

const TIMEZONES = [
  'Asia/Calcutta',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'UTC',
];

export const SettingsScreen = ({ route, navigation }: any) => {
  const initialUser = route.params?.user || {
    id: '670000000000000000000001',
    timezone: 'Asia/Calcutta',
    streak_freezes_available: 2,
    notification: 'enabled',
  };

  const [selectedTz, setSelectedTz] = useState(initialUser.timezone || 'Asia/Calcutta');
  const [notificationEnabled, setNotificationEnabled] = useState(
    initialUser.notification !== 'disabled'
  );
  const [saving, setSaving] = useState(false);

  const handleSaveTimezone = async (tz: string) => {
    setSelectedTz(tz);
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/users/${initialUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: tz }),
      });
      Alert.alert('Timezone Updated', `Your evaluation timezone is now set to ${tz}`);
    } catch {
      Alert.alert('Notice', `Timezone set locally to ${tz}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (value: boolean) => {
    setNotificationEnabled(value);
    const newStatus = value ? 'enabled' : 'disabled';

    try {
      await fetch(`${API_BASE_URL}/users/${initialUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification: newStatus }),
      });
    } catch {
      console.log('[Settings] Saved notification state locally:', newStatus);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* 1. Push Notification Toggle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Push Notifications</Text>
          <Text style={styles.sectionDesc}>
            Enable or disable automated alerts at 8:00 PM local time if any daily habit is left uncompleted.
          </Text>

          <View style={styles.toggleCard}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={styles.toggleTitle}>
                {notificationEnabled ? '🔔 Reminders Enabled' : '🔕 Reminders Disabled'}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {notificationEnabled
                  ? 'Active alerts scheduled daily at 8:00 PM'
                  : 'All streak reminder notifications paused'}
              </Text>
            </View>

            <Switch
              value={notificationEnabled}
              onValueChange={handleToggleNotification}
              trackColor={{ false: '#27272a', true: '#ea580c' }}
              thumbColor={notificationEnabled ? '#ffffff' : '#71717a'}
            />
          </View>
        </View>

        {/* 2. Timezone Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Timezone Synchronization</Text>
          <Text style={styles.sectionDesc}>
            TaskStreak strictly calculates daily completion windows using your selected IANA timezone to prevent clock manipulation.
          </Text>

          <View style={styles.tzList}>
            {TIMEZONES.map((tz) => {
              const isSelected = selectedTz === tz;
              return (
                <TouchableOpacity
                  key={tz}
                  onPress={() => handleSaveTimezone(tz)}
                  style={[styles.tzItem, isSelected && styles.tzItemSelected]}
                >
                  <Text style={[styles.tzName, isSelected && styles.tzNameSelected]}>
                    {tz}
                  </Text>
                  {isSelected && <Text style={styles.tzCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Streak Freezes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Streak Protection</Text>
          <View style={styles.freezeInfoCard}>
            <Text style={styles.freezeCardTitle}>❄️ Streak Freezes</Text>
            <Text style={styles.freezeCardCount}>
              {initialUser.streak_freezes_available ?? 2} Freezes Available
            </Text>
            <Text style={styles.freezeCardDesc}>
              If you miss a single day, an available freeze will automatically save your streak counter from resetting to zero.
            </Text>
          </View>
        </View>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#18181b',
    borderRadius: 10,
    marginRight: 14,
  },
  backText: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
    marginBottom: 14,
  },
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#18181b',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  tzList: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  tzItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  tzItemSelected: {
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
  },
  tzName: {
    fontSize: 14,
    color: '#d4d4d8',
    fontWeight: '500',
  },
  tzNameSelected: {
    color: '#fb923c',
    fontWeight: '700',
  },
  tzCheck: {
    color: '#ea580c',
    fontSize: 16,
    fontWeight: '800',
  },
  freezeInfoCard: {
    backgroundColor: '#082f49',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  freezeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0f2fe',
  },
  freezeCardCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38bdf8',
    marginTop: 4,
  },
  freezeCardDesc: {
    fontSize: 12,
    color: '#bae6fd',
    marginTop: 6,
    lineHeight: 16,
  },
});

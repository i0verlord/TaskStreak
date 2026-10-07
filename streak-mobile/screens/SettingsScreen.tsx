import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
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
  const user = route.params?.user || {
    id: 1,
    timezone: 'Asia/Calcutta',
    streak_freezes_available: 2,
  };

  const [selectedTz, setSelectedTz] = useState(user.timezone || 'Asia/Calcutta');
  const [saving, setSaving] = useState(false);

  const handleSaveTimezone = async (tz: string) => {
    setSelectedTz(tz);
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/users/${user.id}`, {
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

        {/* Timezone Section */}
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

        {/* Streak Freezes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Streak Protection</Text>
          <View style={styles.freezeInfoCard}>
            <Text style={styles.freezeCardTitle}>❄️ Streak Freezes</Text>
            <Text style={styles.freezeCardCount}>
              {user.streak_freezes_available} Freezes Available
            </Text>
            <Text style={styles.freezeCardDesc}>
              If you miss a single day, an available freeze will automatically save your streak counter from resetting to zero.
            </Text>
          </View>
        </View>

        {/* Push Notification Hook Info */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Expo Push Notification Hook</Text>
          <Text style={styles.sectionDesc}>
            The server runs an hourly cron job checking for 8:00 PM in your timezone. If an active task is uncompleted, an Expo Push Notification is dispatched to protect your streak.
          </Text>
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

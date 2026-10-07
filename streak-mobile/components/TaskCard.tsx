import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Task } from '../hooks/useTasks';

interface TaskCardProps {
  task: Task;
  onDone: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDone }) => {
  const isLocked = task.completed_today || task.is_locked;

  // Reanimated shared values for bouncing fire emoji
  const fireScale = useSharedValue(1);
  const fireRotate = useSharedValue(0);

  // Trigger bounce animation when current_streak changes
  useEffect(() => {
    if (task.current_streak > 0) {
      fireScale.value = withSequence(
        withTiming(1.45, { duration: 160 }),
        withSpring(1, { damping: 4, stiffness: 180 })
      );
      fireRotate.value = withSequence(
        withTiming(-15, { duration: 80 }),
        withTiming(15, { duration: 80 }),
        withSpring(0)
      );
    }
  }, [task.current_streak]);

  const animatedFireStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: fireScale.value },
        { rotate: `${fireRotate.value}deg` },
      ],
    };
  });

  return (
    <View style={[styles.card, isLocked && styles.cardLocked]}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
          <Text style={styles.longestStreak}>
            Best Streak: {task.longest_streak} days 🏆
          </Text>
        </View>

        {/* Animated Fire Emoji Badge */}
        <View style={styles.fireBadge}>
          <Animated.Text style={[styles.fireEmoji, animatedFireStyle]}>
            🔥
          </Animated.Text>
          <Text style={styles.streakCount}>{task.current_streak}</Text>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.statusLabel}>
            {isLocked ? 'Completed Today ✨' : 'Ready to Check In'}
          </Text>
          <Text style={styles.statusSub}>
            {isLocked ? 'Button locked until tomorrow' : 'Tap to continue your streak'}
          </Text>
        </View>

        {/* Large Circular "Done" Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isLocked}
          onPress={() => onDone(task)}
          style={[
            styles.doneButton,
            isLocked ? styles.doneButtonDisabled : styles.doneButtonActive,
          ]}
        >
          <Text style={[styles.doneButtonText, isLocked && styles.doneButtonTextDisabled]}>
            {isLocked ? 'LOCKED' : 'DONE'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLocked: {
    borderColor: '#3f3f46',
    opacity: 0.88,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4f4f5',
    letterSpacing: -0.3,
  },
  longestStreak: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 4,
    fontWeight: '500',
  },
  fireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.4)',
  },
  fireEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fb923c',
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e4e4e7',
  },
  statusSub: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  doneButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonActive: {
    backgroundColor: '#ea580c',
    shadowColor: '#ea580c',
    shadowOpacity: 0.4,
  },
  doneButtonDisabled: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  doneButtonTextDisabled: {
    color: '#71717a',
    fontSize: 11,
  },
});

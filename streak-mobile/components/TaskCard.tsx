import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Task } from '../hooks/useTasks';

interface TaskCardProps {
  task: Task;
  onDone: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  isSelected?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDone, onDelete, isSelected }) => {
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
    <View style={[
      styles.cardWrapper,
      isSelected && styles.cardWrapperSelected
    ]}>
      <View style={[styles.card, isLocked && styles.cardLocked]}>
        {/* Header Info */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={[styles.title, { flex: 1 }]} numberOfLines={2}>
                {task.title}
              </Text>
              {onDelete && (
                <TouchableOpacity 
                  onPress={() => onDelete(task.id)} 
                  style={{ marginLeft: 8, padding: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}
                >
                  <Text style={{ fontSize: 14 }}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
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
          >
            {isLocked ? (
              <View style={[styles.doneButton, styles.doneButtonDisabled]}>
                <Text style={styles.doneButtonTextDisabled}>LOCKED</Text>
              </View>
            ) : (
              <LinearGradient
                colors={['#f97316', '#ea580c', '#c2410c']}
                style={styles.doneButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.doneButtonText}>DONE</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 22,
    padding: 2,
    backgroundColor: 'transparent',
  },
  cardWrapperSelected: {
    backgroundColor: '#ea580c',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardLocked: {
    borderColor: '#3f3f46',
    opacity: 0.85,
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
    fontWeight: '800',
    color: '#f4f4f5',
    letterSpacing: -0.2,
  },
  longestStreak: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 6,
    fontWeight: '600',
  },
  fireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.4)',
  },
  fireEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  streakCount: {
    fontSize: 20,
    fontWeight: '900',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#e4e4e7',
  },
  statusSub: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  doneButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonDisabled: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  doneButtonTextDisabled: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '800',
  },
});

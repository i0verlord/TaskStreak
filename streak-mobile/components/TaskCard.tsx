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
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number | string) => void;
  isSelected?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onDone,
  onEdit,
  onDelete,
  isSelected,
}) => {
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
    <View style={[styles.cardWrapper, isSelected && styles.cardWrapperSelected]}>
      <View style={[styles.card, isLocked && styles.cardLocked]}>
        {/* Header Info */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.title, { flex: 1 }]} numberOfLines={2}>
                {task.title}
              </Text>

              {/* Edit Button */}
              {onEdit && (
                <TouchableOpacity
                  onPress={() => onEdit(task)}
                  style={styles.actionIconButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: 13 }}>✏️</Text>
                </TouchableOpacity>
              )}

              {/* Delete Button */}
              {onDelete && (
                <TouchableOpacity
                  onPress={() => onDelete(task.id)}
                  style={[styles.actionIconButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', marginLeft: 6 }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: 13 }}>🗑️</Text>
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
            onPress={() => onDone(task)}
            disabled={isLocked}
            style={[styles.buttonWrapper, isLocked && styles.buttonDisabled]}
          >
            {isLocked ? (
              <View style={styles.lockedInner}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.lockText}>DONE</Text>
              </View>
            ) : (
              <LinearGradient
                colors={['#ea580c', '#c2410c']}
                style={styles.activeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.doneText}>DONE</Text>
                <Text style={styles.doneCheck}>✓</Text>
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
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardWrapperSelected: {
    borderWidth: 2,
    borderColor: '#ea580c',
  },
  card: {
    backgroundColor: '#0E1527',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardLocked: {
    backgroundColor: '#0E1527',
    borderColor: '#1f1f23',
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  actionIconButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  },
  longestStreak: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
    marginTop: 2,
  },
  fireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  fireEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fb923c',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 14,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  statusSub: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  buttonWrapper: {
    width: 80,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.85,
  },
  activeGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
    marginRight: 4,
  },
  doneCheck: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  lockedInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 22,
  },
  lockIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  lockText: {
    color: '#a1a1aa',
    fontWeight: '700',
    fontSize: 11,
  },
});

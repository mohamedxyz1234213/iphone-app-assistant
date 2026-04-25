import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Task } from '../types';
import { useTaskStore } from '../store/taskStore';
import PriorityBadge from './PriorityBadge';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: Colors.urgent,
  high: Colors.high,
  normal: Colors.normal,
  low: Colors.low,
};

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TaskCard({ task, onPress }: TaskCardProps) {
  const { toggleComplete } = useTaskStore();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.97); };
  const handlePressOut = () => { scale.value = withSpring(1); };

  const isCompleted = task.status === 'completed';
  const priorityColor = PRIORITY_COLORS[task.priority] ?? Colors.normal;

  const formatDate = (dateStr: string | null, timeStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return timeStr ? `${formatted} at ${timeStr}` : formatted;
  };

  const dueLabel = formatDate(task.dueDate, task.dueTime);
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

  return (
    <AnimatedPressable
      style={[styles.container, animStyle, isCompleted && styles.completed]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Priority bar */}
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[styles.title, isCompleted && styles.titleCompleted]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <Pressable
            onPress={() => toggleComplete(task.id)}
            style={styles.checkButton}
            hitSlop={8}
          >
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isCompleted ? Colors.success : Colors.textMuted}
            />
          </Pressable>
        </View>

        {task.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}

        <View style={styles.bottomRow}>
          <PriorityBadge priority={task.priority} />
          {dueLabel ? (
            <View style={styles.dueRow}>
              <Ionicons
                name="time-outline"
                size={12}
                color={isOverdue ? Colors.urgent : Colors.textMuted}
              />
              <Text
                style={[styles.dueText, isOverdue && { color: Colors.urgent }]}
              >
                {dueLabel}
              </Text>
            </View>
          ) : null}
          {task.aiSuggested ? (
            <Ionicons name="sparkles" size={13} color={Colors.accent} />
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  completed: { opacity: 0.55 },
  priorityBar: { width: 4 },
  content: { flex: 1, padding: 14, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  titleCompleted: { textDecorationLine: 'line-through', color: Colors.textMuted },
  description: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dueText: { fontSize: 12, color: Colors.textMuted },
  checkButton: { padding: 2 },
});

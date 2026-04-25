import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  dim?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function EventCard({ event, onPress, dim = false }: EventCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: dim ? 0.5 : 1,
  }));

  const handlePressIn = () => { scale.value = withSpring(0.97); };
  const handlePressOut = () => { scale.value = withSpring(1); };

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const reminderLabel =
    event.reminderMinutes >= 1440
      ? '1 day before'
      : event.reminderMinutes >= 60
      ? `${event.reminderMinutes / 60}h before`
      : `${event.reminderMinutes}m before`;

  return (
    <AnimatedPressable
      style={[styles.container, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Color accent */}
      <View style={[styles.accent, { backgroundColor: event.color }]} />

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        {event.description ? (
          <Text style={styles.description} numberOfLines={1}>{event.description}</Text>
        ) : null}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{event.time}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="notifications-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{reminderLabel}</Text>
          </View>
        </View>
      </View>

      {/* Day number badge */}
      <View style={[styles.dayBadge, { borderColor: event.color }]}>
        <Text style={[styles.dayNum, { color: event.color }]}>
          {eventDate.getDate()}
        </Text>
        <Text style={styles.dayMonth}>
          {eventDate.toLocaleDateString('en-US', { month: 'short' })}
        </Text>
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
    alignItems: 'center',
  },
  accent: { width: 4, alignSelf: 'stretch' },
  content: { flex: 1, padding: 14, gap: 4 },
  title: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  description: { fontSize: 13, color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textMuted },
  dayBadge: {
    marginRight: 14,
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontSize: 18, fontWeight: '800', lineHeight: 20 },
  dayMonth: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
});

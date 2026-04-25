import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Priority } from '../types';

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; bg: string; text: string }
> = {
  urgent: { label: '🔴 Urgent', bg: Colors.urgent + '22', text: Colors.urgent },
  high:   { label: '🟠 High',   bg: Colors.high + '22',   text: Colors.high },
  normal: { label: '🔵 Normal', bg: Colors.normal + '22', text: Colors.primary },
  low:    { label: '🟢 Low',    bg: Colors.low + '22',    text: Colors.low },
};

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export default function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === 'md' && styles.badgeMd]}>
      <Text style={[styles.label, { color: config.text }, size === 'md' && styles.labelMd]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  labelMd: {
    fontSize: 13,
  },
});

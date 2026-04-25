import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Gradients } from '../constants/colors';
import { useEventStore } from '../store/eventStore';
import { EventStackParamList } from '../navigation/AppNavigator';
import GlassCard from '../components/GlassCard';

type RouteType = RouteProp<EventStackParamList, 'AddEvent'>;

const REMINDER_OPTIONS = [
  { label: '15 min before', value: 15 },
  { label: '30 min before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
];

const EVENT_COLORS = [
  '#4F7BFF',
  '#A855F7',
  '#FF4757',
  '#2ECC71',
  '#F39C12',
  '#00BCD4',
];

export default function AddEventScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteType>();
  const eventId = route.params?.eventId;
  const { events, addEvent, updateEvent, deleteEvent } = useEventStore();

  const existing = eventId ? events.find((e) => e.id === eventId) : null;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [date, setDate] = useState(existing?.date?.split('T')[0] ?? '');
  const [time, setTime] = useState(existing?.time ?? '');
  const [reminderMinutes, setReminderMinutes] = useState(existing?.reminderMinutes ?? 30);
  const [color, setColor] = useState(existing?.color ?? EVENT_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!existing;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an event title.');
      return;
    }
    if (!date) {
      Alert.alert('Required', 'Please enter a date (YYYY-MM-DD).');
      return;
    }
    if (!time) {
      Alert.alert('Required', 'Please enter a time (HH:MM).');
      return;
    }

    setIsSaving(true);
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        date: new Date(date).toISOString(),
        time,
        notificationId: existing?.notificationId ?? null,
        reminderMinutes,
        color,
      };

      if (isEditing && eventId) {
        await updateEvent(eventId, eventData);
      } else {
        await addEvent(eventData);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save event.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!eventId) return;
    Alert.alert('Delete Event', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEvent(eventId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>{isEditing ? 'Edit Event' : 'New Event'}</Text>
          {isEditing ? (
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Form */}
        <GlassCard style={styles.formCard}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Event name"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Details..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2024-12-31"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Time * (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="14:00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numbers-and-punctuation"
          />
        </GlassCard>

        {/* Reminder */}
        <Text style={styles.sectionTitle}>Reminder</Text>
        <View style={styles.optionGrid}>
          {REMINDER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[
                styles.optionButton,
                reminderMinutes === opt.value && styles.optionButtonActive,
              ]}
              onPress={() => setReminderMinutes(opt.value)}
            >
              {reminderMinutes === opt.value ? (
                <LinearGradient
                  colors={Gradients.primary}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              ) : null}
              <Text
                style={[
                  styles.optionLabel,
                  reminderMinutes === opt.value && styles.optionLabelActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Color Picker */}
        <Text style={styles.sectionTitle}>Color</Text>
        <View style={styles.colorRow}>
          {EVENT_COLORS.map((c) => (
            <Pressable
              key={c}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                color === c && styles.colorDotSelected,
              ]}
              onPress={() => setColor(c)}
            >
              {color === c ? (
                <Ionicons name="checkmark" size={16} color={Colors.white} />
              ) : null}
            </Pressable>
          ))}
        </View>

        {/* Save */}
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <LinearGradient colors={Gradients.primary} style={styles.saveGradient}>
            {isSaving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveText}>{isEditing ? 'Update Event' : 'Add Event'}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  formCard: { marginBottom: 20, gap: 4 },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  textArea: { height: 80 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    width: '47%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  optionButtonActive: { borderColor: Colors.primary },
  optionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  optionLabelActive: { color: Colors.white },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: Colors.white,
  },
  saveButton: { borderRadius: 16, overflow: 'hidden' },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});

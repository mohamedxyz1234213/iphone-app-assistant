import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Gradients } from '../constants/colors';
import { Priority, Task } from '../types';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import { AIService } from '../services/aiService';
import { TaskStackParamList } from '../navigation/AppNavigator';
import GlassCard from '../components/GlassCard';

type RouteType = RouteProp<TaskStackParamList, 'AddTask'>;

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'urgent', label: '🔴 Urgent', color: Colors.urgent },
  { value: 'high', label: '🟠 High', color: Colors.high },
  { value: 'normal', label: '🔵 Normal', color: Colors.normal },
  { value: 'low', label: '🟢 Low', color: Colors.low },
];

export default function AddTaskScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteType>();
  const taskId = route.params?.taskId;
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  const { settings } = useSettingsStore();

  const existingTask = taskId ? tasks.find((t) => t.id === taskId) : null;

  const [title, setTitle] = useState(existingTask?.title ?? '');
  const [description, setDescription] = useState(existingTask?.description ?? '');
  const [priority, setPriority] = useState<Priority>(existingTask?.priority ?? 'normal');
  const [dueDate, setDueDate] = useState<string>(existingTask?.dueDate ?? '');
  const [dueTime, setDueTime] = useState<string>(existingTask?.dueTime ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReason, setAiReason] = useState<string | null>(existingTask?.aiReason ?? null);

  const isEditing = !!existingTask;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a task title.');
      return;
    }
    setIsSaving(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status: existingTask?.status ?? ('pending' as const),
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        notificationId: existingTask?.notificationId ?? null,
        aiSuggested: !!aiReason,
        aiReason: aiReason,
      };

      if (isEditing && taskId) {
        await updateTask(taskId, taskData);
      } else {
        await addTask(taskData);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save task.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!taskId) return;
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(taskId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleAISuggest = async () => {
    if (!settings.openAiApiKey) {
      Alert.alert('API Key Missing', 'Add your OpenAI key in Settings first.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a task title first.');
      return;
    }
    setIsAiLoading(true);
    try {
      const result = await AIService.suggestTaskPriority(
        title,
        description,
        dueDate || null,
        settings.openAiApiKey,
        settings.aiModel
      );
      setPriority(result.priority);
      setAiReason(result.reason);
      Alert.alert('AI Suggestion', `Priority set to ${result.priority}.\n\n${result.reason}`);
    } catch (e) {
      Alert.alert('AI Error', e instanceof Error ? e.message : 'Failed to get AI suggestion.');
    } finally {
      setIsAiLoading(false);
    }
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
          <Text style={styles.title}>{isEditing ? 'Edit Task' : 'New Task'}</Text>
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
            placeholder="What needs to be done?"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="next"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add details..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Due Date</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Due Time</Text>
          <TextInput
            style={styles.input}
            value={dueTime}
            onChangeText={setDueTime}
            placeholder="HH:MM (e.g. 09:30)"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numbers-and-punctuation"
          />
        </GlassCard>

        {/* Priority Picker */}
        <Text style={styles.sectionTitle}>Priority</Text>
        <View style={styles.priorityGrid}>
          {PRIORITIES.map((p) => (
            <Pressable
              key={p.value}
              style={[
                styles.priorityButton,
                priority === p.value && { borderColor: p.color, borderWidth: 2 },
              ]}
              onPress={() => setPriority(p.value)}
            >
              {priority === p.value ? (
                <LinearGradient
                  colors={[p.color + '33', p.color + '11']}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <Text style={[styles.priorityLabel, priority === p.value && { color: p.color }]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {aiReason ? (
          <GlassCard style={styles.aiReasonCard}>
            <Ionicons name="sparkles" size={14} color={Colors.accent} />
            <Text style={styles.aiReasonText}>{aiReason}</Text>
          </GlassCard>
        ) : null}

        {/* AI Button */}
        <Pressable
          style={({ pressed }) => [styles.aiButton, pressed && { opacity: 0.75 }]}
          onPress={handleAISuggest}
          disabled={isAiLoading}
        >
          {isAiLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={Colors.white} />
              <Text style={styles.aiButtonText}>AI Suggest Priority</Text>
            </>
          )}
        </Pressable>

        {/* Save Button */}
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <LinearGradient colors={Gradients.primary} style={styles.saveGradient}>
            {isSaving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveText}>{isEditing ? 'Update Task' : 'Add Task'}</Text>
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
  label: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  textArea: { height: 90 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  priorityButton: {
    width: '47%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  aiReasonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  aiReasonText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
    minHeight: 48,
  },
  aiButtonText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  saveButton: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});

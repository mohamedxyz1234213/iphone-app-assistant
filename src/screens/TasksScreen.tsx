import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Colors, Gradients } from '../constants/colors';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import { Task } from '../types';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';
import FloatingActionButton from '../components/FloatingActionButton';

type FilterTab = 'all' | 'pending' | 'completed';

export default function TasksScreen() {
  const navigation = useNavigation<any>();
  const { tasks, isAiLoading, aiError, aiPrioritize, clearAiError } = useTaskStore();
  const { settings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    if (aiError) {
      Alert.alert('AI Error', aiError, [{ text: 'OK', onPress: clearAiError }]);
    }
  }, [aiError]);

  const filtered = tasks.filter((t) => {
    if (activeTab === 'pending') return t.status !== 'completed';
    if (activeTab === 'completed') return t.status === 'completed';
    return true;
  });

  const handleAIPrioritize = () => {
    if (!settings.openAiApiKey) {
      Alert.alert(
        'API Key Missing',
        'Please add your OpenAI API key in Settings to use AI prioritization.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => navigation.navigate('SettingsTab') },
        ]
      );
      return;
    }
    aiPrioritize(settings.openAiApiKey, settings.aiModel);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <Pressable
          style={({ pressed }) => [styles.aiButton, pressed && { opacity: 0.75 }]}
          onPress={handleAIPrioritize}
          disabled={isAiLoading}
        >
          {isAiLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={Colors.white} />
              <Text style={styles.aiButtonText}>AI Sort</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        {(['all', 'pending', 'completed'] as FilterTab[]).map((tab) => (
          <FilterTabButton
            key={tab}
            label={tab.charAt(0).toUpperCase() + tab.slice(1)}
            active={activeTab === tab}
            onPress={() => setActiveTab(tab)}
          />
        ))}
      </View>

      {/* Task List */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji="✅"
          title={
            activeTab === 'completed'
              ? 'No completed tasks yet'
              : 'No tasks here'
          }
          subtitle={
            activeTab === 'completed'
              ? 'Complete some tasks to see them here.'
              : 'Tap + to add your first task!'
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
              <TaskCard
                task={item}
                onPress={() =>
                  navigation.navigate('AddTask', { taskId: item.id })
                }
              />
            </Animated.View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FloatingActionButton
        onPress={() => navigation.navigate('AddTask')}
        icon="add"
      />
    </SafeAreaView>
  );
}

function FilterTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      {active ? (
        <LinearGradient
          colors={Gradients.primary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      ) : null}
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 90,
    justifyContent: 'center',
  },
  aiButtonText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: Colors.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tabActive: { borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
});

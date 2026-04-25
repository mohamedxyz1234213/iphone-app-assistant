import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Event, AppSettings } from '../types';

const KEYS = {
  TASKS: '@aiassistant:tasks',
  EVENTS: '@aiassistant:events',
  SETTINGS: '@aiassistant:settings',
};

export const StorageService = {
  // --- Tasks ---
  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('[StorageService] Failed to save tasks:', error);
    }
  },

  async loadTasks(): Promise<Task[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.TASKS);
      if (!raw) return [];
      return JSON.parse(raw) as Task[];
    } catch (error) {
      console.error('[StorageService] Failed to load tasks:', error);
      return [];
    }
  },

  // --- Events ---
  async saveEvents(events: Event[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error('[StorageService] Failed to save events:', error);
    }
  },

  async loadEvents(): Promise<Event[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.EVENTS);
      if (!raw) return [];
      return JSON.parse(raw) as Event[];
    } catch (error) {
      console.error('[StorageService] Failed to load events:', error);
      return [];
    }
  },

  // --- Settings ---
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('[StorageService] Failed to save settings:', error);
    }
  },

  async loadSettings(): Promise<AppSettings | null> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
      if (!raw) return null;
      return JSON.parse(raw) as AppSettings;
    } catch (error) {
      console.error('[StorageService] Failed to load settings:', error);
      return null;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.error('[StorageService] Failed to clear storage:', error);
    }
  },
};

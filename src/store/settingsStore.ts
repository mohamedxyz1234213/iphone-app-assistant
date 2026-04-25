import { create } from 'zustand';
import { AppSettings, ScreenTimeSettings } from '../types';
import { StorageService } from '../services/storageService';
import { DEFAULT_BLOCKED_APPS } from '../constants';

const DEFAULT_SCREEN_TIME: ScreenTimeSettings = {
  enabled: false,
  dailyLimitMinutes: 120,
  usedMinutesToday: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
  blockMode: 'timed',
  blockDurationMinutes: 30,
  blockedApps: DEFAULT_BLOCKED_APPS,
  isCurrentlyBlocking: false,
  blockStartTime: null,
  blockUntilTime: null,
  blockUntilTaskId: null,
};

const DEFAULT_SETTINGS: AppSettings = {
  openAiApiKey: '',
  aiModel: 'gpt-4o-mini',
  userName: 'Friend',
  theme: 'dark',
  notificationsEnabled: true,
  screenTimeSettings: DEFAULT_SCREEN_TIME,
};

interface SettingsStore {
  settings: AppSettings;
  isLoading: boolean;

  loadFromStorage: () => Promise<void>;
  updateSettings: (updates: Partial<Omit<AppSettings, 'screenTimeSettings'>>) => Promise<void>;
  updateScreenTimeSettings: (updates: Partial<ScreenTimeSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,

  async loadFromStorage() {
    set({ isLoading: true });
    const saved = await StorageService.loadSettings();
    if (saved) {
      // Merge with defaults so new fields are always present
      set({
        settings: {
          ...DEFAULT_SETTINGS,
          ...saved,
          screenTimeSettings: {
            ...DEFAULT_SCREEN_TIME,
            ...saved.screenTimeSettings,
            blockedApps:
              saved.screenTimeSettings?.blockedApps?.length
                ? saved.screenTimeSettings.blockedApps
                : DEFAULT_BLOCKED_APPS,
          },
        },
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  async updateSettings(updates) {
    const settings = { ...get().settings, ...updates };
    set({ settings });
    await StorageService.saveSettings(settings);
  },

  async updateScreenTimeSettings(updates) {
    const settings = {
      ...get().settings,
      screenTimeSettings: { ...get().settings.screenTimeSettings, ...updates },
    };
    set({ settings });
    await StorageService.saveSettings(settings);
  },
}));

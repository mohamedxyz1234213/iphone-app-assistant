import { create } from 'zustand';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useSettingsStore } from './settingsStore';
import { ScreenTimeService } from '../services/screenTimeService';

interface ScreenTimeStore {
  intervalId: ReturnType<typeof setInterval> | null;
  appStateSubscription: { remove: () => void } | null;
  isForegrounded: boolean;

  startTracking: () => void;
  stopTracking: () => void;
  tick: () => Promise<void>;
  resetIfNewDay: () => Promise<void>;
  triggerBlock: (
    mode: 'task_completion' | 'timed',
    taskId?: string,
    durationMinutes?: number
  ) => Promise<void>;
  stopBlock: () => Promise<void>;
}

export const useScreenTimeStore = create<ScreenTimeStore>((set, get) => ({
  intervalId: null,
  appStateSubscription: null,
  isForegrounded: true,

  startTracking() {
    if (get().intervalId) return;
    get().resetIfNewDay();

    // Only tick when the app is in the foreground to avoid unnecessary battery drain.
    // The interval fires every 60 seconds but skips the update when backgrounded.
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        set({ isForegrounded: nextState === 'active' });
      }
    );

    const id = setInterval(() => {
      if (get().isForegrounded) {
        get().tick();
      }
    }, 60_000); // tick every minute, foreground only

    set({ intervalId: id, appStateSubscription: subscription });
  },

  stopTracking() {
    const { intervalId, appStateSubscription } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (appStateSubscription) {
      appStateSubscription.remove();
    }
    set({ intervalId: null, appStateSubscription: null });
  },

  async tick() {
    const { settings, updateScreenTimeSettings } = useSettingsStore.getState();
    const st = settings.screenTimeSettings;
    if (!st.enabled) return;

    await get().resetIfNewDay();

    const newUsed = st.usedMinutesToday + 1;
    await updateScreenTimeSettings({ usedMinutesToday: newUsed });

    // Check if limit exceeded and not already blocking
    if (newUsed >= st.dailyLimitMinutes && !st.isCurrentlyBlocking) {
      await get().triggerBlock(st.blockMode, undefined, st.blockDurationMinutes);
    }

    // Check if timed block has expired
    if (st.isCurrentlyBlocking && st.blockMode === 'timed' && st.blockUntilTime) {
      const untilTime = new Date(st.blockUntilTime);
      if (new Date() >= untilTime) {
        await get().stopBlock();
      }
    }
  },

  async resetIfNewDay() {
    const { settings, updateScreenTimeSettings } = useSettingsStore.getState();
    const st = settings.screenTimeSettings;
    const today = new Date().toISOString().split('T')[0];
    if (st.lastResetDate !== today) {
      await updateScreenTimeSettings({
        usedMinutesToday: 0,
        lastResetDate: today,
        isCurrentlyBlocking: false,
        blockStartTime: null,
        blockUntilTime: null,
        blockUntilTaskId: null,
      });
      await ScreenTimeService.stopBlocking();
    }
  },

  async triggerBlock(mode, taskId, durationMinutes) {
    const { settings, updateScreenTimeSettings } = useSettingsStore.getState();
    const st = settings.screenTimeSettings;

    const selectedBundleIds = st.blockedApps
      .filter((a) => a.isSelected)
      .map((a) => a.bundleId);

    await ScreenTimeService.startBlocking(selectedBundleIds, durationMinutes);

    const now = new Date();
    const blockUntilTime =
      mode === 'timed' && durationMinutes
        ? new Date(now.getTime() + durationMinutes * 60_000).toISOString()
        : null;

    await updateScreenTimeSettings({
      isCurrentlyBlocking: true,
      blockStartTime: now.toISOString(),
      blockUntilTime,
      blockUntilTaskId: taskId ?? null,
    });
  },

  async stopBlock() {
    await ScreenTimeService.stopBlocking();
    const { updateScreenTimeSettings } = useSettingsStore.getState();
    await updateScreenTimeSettings({
      isCurrentlyBlocking: false,
      blockStartTime: null,
      blockUntilTime: null,
      blockUntilTaskId: null,
    });
  },
}));

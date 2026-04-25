import { NativeModules, Platform } from 'react-native';

const { ScreenTimeModule } = NativeModules;

const isIOS = Platform.OS === 'ios';

export interface UsageStats {
  usedMinutesToday: number;
}

export const ScreenTimeService = {
  isAvailable(): boolean {
    return isIOS && !!ScreenTimeModule;
  },

  async requestAuthorization(): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('[ScreenTime] Native module not available on this platform.');
      return false;
    }
    try {
      const result = await ScreenTimeModule.requestAuthorization();
      return !!result;
    } catch (error) {
      console.error('[ScreenTime] Authorization failed:', error);
      return false;
    }
  },

  async startBlocking(bundleIds: string[], durationMinutes?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('[ScreenTime] Blocking not available — native module missing.');
      return false;
    }
    try {
      if (bundleIds.length > 0) {
        await ScreenTimeModule.blockApps(bundleIds);
      } else {
        await ScreenTimeModule.blockAllSocialMedia();
      }
      return true;
    } catch (error) {
      console.error('[ScreenTime] Failed to start blocking:', error);
      return false;
    }
  },

  async stopBlocking(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      await ScreenTimeModule.unblockApps();
      return true;
    } catch (error) {
      console.error('[ScreenTime] Failed to stop blocking:', error);
      return false;
    }
  },

  async getUsageStats(): Promise<UsageStats> {
    // In a real implementation this would query DeviceActivity data.
    // Returning a placeholder since direct usage query requires separate
    // DeviceActivityReport extension setup.
    return { usedMinutesToday: 0 };
  },
};

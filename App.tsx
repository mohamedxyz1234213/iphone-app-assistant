import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useTaskStore } from './src/store/taskStore';
import { useEventStore } from './src/store/eventStore';
import { useSettingsStore } from './src/store/settingsStore';
import { useScreenTimeStore } from './src/store/screenTimeStore';
import { NotificationService } from './src/services/notificationService';

export default function App() {
  const { loadFromStorage: loadTasks } = useTaskStore();
  const { loadFromStorage: loadEvents } = useEventStore();
  const { loadFromStorage: loadSettings, settings } = useSettingsStore();
  const { startTracking } = useScreenTimeStore();

  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await loadTasks();
      await loadEvents();
      await NotificationService.requestPermissions();
    };
    init();
  }, []);

  useEffect(() => {
    if (settings.screenTimeSettings.enabled) {
      startTracking();
    }
  }, [settings.screenTimeSettings.enabled]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

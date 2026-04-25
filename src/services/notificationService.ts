import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Task, Event } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('[Notifications] Push notifications only work on physical devices.');
      return false;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F7BFF',
      });
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  },

  async scheduleTaskReminder(task: Task): Promise<string | null> {
    if (!task.dueDate) return null;
    try {
      const dueDate = new Date(task.dueDate);
      if (task.dueTime) {
        const [hours, minutes] = task.dueTime.split(':').map(Number);
        dueDate.setHours(hours, minutes, 0, 0);
      } else {
        dueDate.setHours(9, 0, 0, 0);
      }

      // Remind TASK_REMINDER_LEAD_MINUTES before the due time
      const TASK_REMINDER_LEAD_MINUTES = 30;
      const triggerDate = new Date(dueDate.getTime() - TASK_REMINDER_LEAD_MINUTES * 60 * 1000);
      if (triggerDate <= new Date()) return null;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ Task Due Soon: ${task.title}`,
          body: task.description || `Your task is due in ${TASK_REMINDER_LEAD_MINUTES} minutes.`,
          data: { taskId: task.id, type: 'task' },
          sound: true,
        },
        trigger: { date: triggerDate },
      });
      return id;
    } catch (error) {
      console.error('[Notifications] Failed to schedule task reminder:', error);
      return null;
    }
  },

  async scheduleEventReminder(event: Event): Promise<string | null> {
    try {
      const eventDate = new Date(event.date);
      const [hours, minutes] = event.time.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);

      const triggerDate = new Date(
        eventDate.getTime() - event.reminderMinutes * 60 * 1000
      );
      if (triggerDate <= new Date()) return null;

      const reminderLabel =
        event.reminderMinutes >= 60
          ? `${event.reminderMinutes / 60} hour(s)`
          : `${event.reminderMinutes} minutes`;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📅 Upcoming: ${event.title}`,
          body: `Starts in ${reminderLabel}. ${event.description || ''}`.trim(),
          data: { eventId: event.id, type: 'event' },
          sound: true,
        },
        trigger: { date: triggerDate },
      });
      return id;
    } catch (error) {
      console.error('[Notifications] Failed to schedule event reminder:', error);
      return null;
    }
  },

  async cancelNotification(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error('[Notifications] Failed to cancel notification:', error);
    }
  },

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[Notifications] Failed to cancel all notifications:', error);
    }
  },
};

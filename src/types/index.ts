export type Priority = 'urgent' | 'high' | 'normal' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;         // ISO string
  dueTime: string | null;         // HH:mm
  notificationId: string | null;
  aiSuggested: boolean;
  aiReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;                   // ISO string
  time: string;                   // HH:mm
  notificationId: string | null;
  reminderMinutes: number;        // remind N minutes before
  color: string;
  createdAt: string;
}

export interface ScreenTimeSettings {
  enabled: boolean;
  dailyLimitMinutes: number;      // total daily screen time budget
  usedMinutesToday: number;
  lastResetDate: string;          // ISO date string YYYY-MM-DD
  blockMode: 'task_completion' | 'timed';
  blockDurationMinutes: number;   // used when blockMode = 'timed'
  blockedApps: BlockedApp[];
  isCurrentlyBlocking: boolean;
  blockStartTime: string | null;  // ISO string when block started
  blockUntilTime: string | null;  // ISO string when block ends
  blockUntilTaskId: string | null;
}

export interface BlockedApp {
  id: string;
  name: string;
  bundleId: string;
  icon: string;                   // emoji icon
  isSelected: boolean;
}

export interface AppSettings {
  openAiApiKey: string;
  aiModel: string;
  userName: string;
  theme: 'dark';
  notificationsEnabled: boolean;
  screenTimeSettings: ScreenTimeSettings;
}

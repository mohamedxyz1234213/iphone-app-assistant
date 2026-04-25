import { create } from 'zustand';
import { Task, Priority, TaskStatus } from '../types';
import { StorageService } from '../services/storageService';
import { AIService } from '../services/aiService';
import { NotificationService } from '../services/notificationService';
import { generateId } from '../utils/generateId';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  isAiLoading: boolean;
  aiError: string | null;

  loadFromStorage: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  aiPrioritize: (apiKey: string, model: string) => Promise<void>;
  clearAiError: () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  isAiLoading: false,
  aiError: null,

  async loadFromStorage() {
    set({ isLoading: true });
    const tasks = await StorageService.loadTasks();
    set({ tasks, isLoading: false });
  },

  async addTask(taskData) {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    // Schedule notification if due date present
    if (newTask.dueDate) {
      const notifId = await NotificationService.scheduleTaskReminder(newTask);
      newTask.notificationId = notifId;
    }

    const tasks = [...get().tasks, newTask];
    set({ tasks });
    await StorageService.saveTasks(tasks);
    return newTask;
  },

  async updateTask(id, updates) {
    const tasks = get().tasks.map((t) => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
      return updated;
    });
    set({ tasks });
    await StorageService.saveTasks(tasks);

    // Re-schedule notification if due date changed
    const updated = tasks.find((t) => t.id === id);
    if (updated && (updates.dueDate !== undefined || updates.dueTime !== undefined)) {
      if (updated.notificationId) {
        await NotificationService.cancelNotification(updated.notificationId);
      }
      if (updated.dueDate) {
        const notifId = await NotificationService.scheduleTaskReminder(updated);
        const finalTasks = tasks.map((t) =>
          t.id === id ? { ...t, notificationId: notifId } : t
        );
        set({ tasks: finalTasks });
        await StorageService.saveTasks(finalTasks);
      }
    }
  },

  async deleteTask(id) {
    const task = get().tasks.find((t) => t.id === id);
    if (task?.notificationId) {
      await NotificationService.cancelNotification(task.notificationId);
    }
    const tasks = get().tasks.filter((t) => t.id !== id);
    set({ tasks });
    await StorageService.saveTasks(tasks);
  },

  async toggleComplete(id) {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus: TaskStatus =
      task.status === 'completed' ? 'pending' : 'completed';
    await get().updateTask(id, { status: newStatus });
  },

  async aiPrioritize(apiKey, model) {
    const pendingTasks = get().tasks.filter((t) => t.status !== 'completed');
    if (pendingTasks.length === 0) return;

    set({ isAiLoading: true, aiError: null });
    try {
      const results = await AIService.prioritizeTasks(pendingTasks, apiKey, model);
      const resultMap = new Map(results.map((r) => [r.taskId, r]));

      const updatedTasks = get().tasks.map((t) => {
        const result = resultMap.get(t.id);
        if (!result) return t;
        return {
          ...t,
          priority: result.priority as Priority,
          aiSuggested: true,
          aiReason: result.reason,
          updatedAt: new Date().toISOString(),
        };
      });

      const sorted = [
        ...AIService.sortByPriority(updatedTasks.filter((t) => t.status !== 'completed')),
        ...updatedTasks.filter((t) => t.status === 'completed'),
      ];

      set({ tasks: sorted, isAiLoading: false });
      await StorageService.saveTasks(sorted);
    } catch (error) {
      set({
        isAiLoading: false,
        aiError: error instanceof Error ? error.message : 'AI prioritization failed.',
      });
    }
  },

  clearAiError() {
    set({ aiError: null });
  },
}));

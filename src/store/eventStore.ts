import { create } from 'zustand';
import { Event } from '../types';
import { StorageService } from '../services/storageService';
import { NotificationService } from '../services/notificationService';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface EventStore {
  events: Event[];
  isLoading: boolean;

  loadFromStorage: () => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'createdAt'>) => Promise<Event>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  isLoading: false,

  async loadFromStorage() {
    set({ isLoading: true });
    const events = await StorageService.loadEvents();
    set({ events, isLoading: false });
  },

  async addEvent(eventData) {
    const newEvent: Event = {
      ...eventData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    const notifId = await NotificationService.scheduleEventReminder(newEvent);
    newEvent.notificationId = notifId;

    const events = [...get().events, newEvent].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    set({ events });
    await StorageService.saveEvents(events);
    return newEvent;
  },

  async updateEvent(id, updates) {
    const existing = get().events.find((e) => e.id === id);
    if (!existing) return;

    if (existing.notificationId) {
      await NotificationService.cancelNotification(existing.notificationId);
    }

    const updated = { ...existing, ...updates };
    const notifId = await NotificationService.scheduleEventReminder(updated);
    updated.notificationId = notifId;

    const events = get()
      .events.map((e) => (e.id === id ? updated : e))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    set({ events });
    await StorageService.saveEvents(events);
  },

  async deleteEvent(id) {
    const event = get().events.find((e) => e.id === id);
    if (event?.notificationId) {
      await NotificationService.cancelNotification(event.notificationId);
    }
    const events = get().events.filter((e) => e.id !== id);
    set({ events });
    await StorageService.saveEvents(events);
  },
}));

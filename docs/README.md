# AI Personal Assistant — iPhone App

A full-featured React Native + Expo personal assistant iOS application combining task management, AI prioritization, event reminders, and screen time control.

---

## Table of Contents

1. [Overview & Features](#overview--features)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Feature Guide](#feature-guide)
5. [API Reference (Services)](#api-reference-services)
6. [iOS Native Module Guide](#ios-native-module-guide)
7. [Technical Interview Section](#technical-interview-section)

---

## Overview & Features

### Core Features

| Feature | Description |
|---|---|
| **Task Manager** | Add, edit, delete tasks with due dates, priorities, and completion tracking |
| **AI Prioritization** | OpenAI GPT-4o integration to intelligently rank your task list |
| **Event Reminders** | Calendar-style events with customizable push notification reminders |
| **Screen Time Limiter** | Daily usage budget enforcement using iOS FamilyControls / ManagedSettings |
| **Modern UI** | Dark navy + electric blue/purple gradients, glassmorphism, Reanimated animations |

### Tech Stack

```
React Native 0.74 + Expo SDK 51 (bare workflow)
TypeScript (strict mode)
React Navigation v6 (bottom tabs + native stack)
Zustand v4 (state management)
AsyncStorage (persistence)
expo-notifications (push reminders)
openai v4 / fetch (AI integration)
react-native-reanimated v3 (animations)
expo-linear-gradient + expo-blur (UI effects)
iOS FamilyControls + ManagedSettings (native screen time)
```

---

## Architecture

```
iphone-app-assistant/
├── App.tsx                    # Root: initializes stores, requests permissions
├── src/
│   ├── types/index.ts         # Shared TypeScript interfaces
│   ├── constants/
│   │   ├── colors.ts          # Design system colors + gradient presets
│   │   └── index.ts           # App constants (default apps, labels, models)
│   ├── services/              # Pure functions / side-effects
│   │   ├── storageService.ts  # AsyncStorage CRUD wrapper
│   │   ├── aiService.ts       # OpenAI API calls (fetch-based)
│   │   ├── notificationService.ts  # expo-notifications helpers
│   │   └── screenTimeService.ts    # Bridge to iOS ScreenTimeModule
│   ├── store/                 # Zustand stores
│   │   ├── taskStore.ts
│   │   ├── eventStore.ts
│   │   ├── settingsStore.ts
│   │   └── screenTimeStore.ts
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Bottom tabs + nested stacks
│   ├── screens/               # Full-page React Native screens
│   └── components/            # Reusable UI components
├── ios/
│   ├── ScreenTimeModule/      # Swift native module (FamilyControls)
│   └── AIAssistant/           # Bridging header
└── docs/README.md
```

### State Management Architecture

Each Zustand store follows a consistent pattern:

```
[Store] ──reads/writes──► [StorageService] ──► AsyncStorage
   │
   └──calls──► [Service Layer] ──► [External API / Native Module]
```

Stores are initialized lazily from `App.tsx` via `loadFromStorage()` calls. The `screenTimeStore` is stateless beyond an interval reference — it delegates all persisted state to `settingsStore`.

---

## Installation & Setup

### Prerequisites

- Node.js 20+
- Xcode 15+ (for iOS native build)
- An Apple Developer account with **Screen Time** entitlement (requires explicit provisioning from Apple)
- Physical iPhone running iOS 16+ (Screen Time features don't run in Simulator)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Generate native iOS project
npx expo prebuild --platform ios

# 3. Open Xcode workspace
open ios/AIAssistant.xcworkspace

# 4. Add FamilyControls capability in Xcode:
#    Target → Signing & Capabilities → + Capability → Family Controls

# 5. Build & run on device
npx expo run:ios --device

# OR start dev server (Expo Go won't work — bare workflow needed)
npx expo start
```

### Environment Setup

1. Open the app → **Settings** tab
2. Enter your name
3. Paste your **OpenAI API key** (`sk-...`) — stored locally on device, never transmitted to any server other than OpenAI
4. Select preferred AI model (GPT-4o recommended)

---

## Feature Guide

### Task Manager

- **Add task**: Tap ＋ FAB on Tasks screen
- **Priority**: Choose Urgent / High / Normal / Low — color-coded throughout
- **Due date**: Enter `YYYY-MM-DD` format; a push notification fires 30 minutes before
- **Complete**: Tap the circle icon on any card, or open task and save with updated status
- **AI Suggest Priority**: Tap ✨ button when adding/editing — sends title + description + due date to OpenAI and auto-fills priority

### AI Prioritization

The **AI Sort** button on the Tasks screen batches all pending tasks and sends them to OpenAI in a single request. The response re-orders tasks by AI-suggested priority and stores the reasoning per task (shown as ✨ icon on card).

**Prompt engineering details:**
- System prompt defines priority semantics strictly
- Today's date is included for relative deadline reasoning
- Response is constrained to JSON array format
- Temperature set to 0.3 for deterministic outputs

### Event Reminders

- Events are sorted chronologically; past events appear dimmed
- Reminder fires N minutes before via `expo-notifications`
- 6 accent colors to visually differentiate event types
- On edit, old notification is cancelled and a new one is scheduled

### Screen Time Limiter

The Screen Time feature works in two layers:

**Layer 1 — JS tracking** (all platforms):
- A 1-minute interval increments `usedMinutesToday`
- Resets at midnight via `lastResetDate` comparison
- When `usedMinutesToday >= dailyLimitMinutes`, `triggerBlock()` is called

**Layer 2 — Native enforcement** (iOS only):
- Calls `ScreenTimeModule.blockApps()` / `blockAllSocialMedia()` via NativeModules bridge
- Uses `ManagedSettingsStore` to apply `ShieldSettings` that show the iOS-native blocking UI
- Requires `com.apple.developer.family-controls` entitlement

**Block modes:**
- `task_completion`: Apps stay blocked until user marks the target task as complete
- `timed`: Apps are unblocked automatically after N minutes (countdown shown in UI)

---

## API Reference (Services)

### `StorageService`

| Method | Description |
|---|---|
| `saveTasks(tasks)` | Persist tasks array to AsyncStorage |
| `loadTasks()` | Load tasks from storage (returns `[]` on error) |
| `saveEvents(events)` | Persist events |
| `loadEvents()` | Load events |
| `saveSettings(settings)` | Persist full settings object |
| `loadSettings()` | Load settings (returns `null` if first launch) |
| `clearAll()` | Wipe all stored data |

### `AIService`

| Method | Parameters | Returns |
|---|---|---|
| `prioritizeTasks` | `tasks, apiKey, model` | `AIPrioritizationResult[]` |
| `suggestTaskPriority` | `title, description, dueDate, apiKey, model` | `AITaskSuggestion` |
| `sortByPriority` | `tasks` | Sorted `Task[]` |

### `NotificationService`

| Method | Description |
|---|---|
| `requestPermissions()` | Request iOS push permission; returns `boolean` |
| `scheduleTaskReminder(task)` | Schedules alert 30 min before due date/time |
| `scheduleEventReminder(event)` | Schedules alert `event.reminderMinutes` before |
| `cancelNotification(id)` | Cancel a specific scheduled notification |
| `cancelAllNotifications()` | Cancel all scheduled notifications |

### `ScreenTimeService`

| Method | Description |
|---|---|
| `isAvailable()` | Returns `true` only on iOS with native module present |
| `requestAuthorization()` | Prompt FamilyControls authorization dialog |
| `startBlocking(bundleIds, duration?)` | Block selected apps (or all social media if array is empty) |
| `stopBlocking()` | Remove all shields |
| `getUsageStats()` | Returns `{ usedMinutesToday }` (placeholder for DeviceActivity extension) |

---

## iOS Native Module Guide

### How FamilyControls Works

Apple's Screen Time API has three frameworks:

| Framework | Purpose |
|---|---|
| `FamilyControls` | Authorization to access family controls APIs |
| `ManagedSettings` | Apply restrictions (shielding apps, web domains) |
| `DeviceActivity` | Monitor usage, schedule restriction windows |

### Authorization Flow

```swift
// Request authorization (shows iOS system dialog)
try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
```

This must happen in response to a user interaction (button tap). The authorization persists until the user revokes it in Settings → Screen Time.

### Shielding Apps

```swift
let store = ManagedSettingsStore()

// By activity category (simpler, doesn't need FamilyActivityPicker)
store.shield.applicationCategories = .specific([.socialNetworking, .entertainment], except: Set())

// By specific app tokens (acquired via FamilyActivityPicker SwiftUI component)
store.shield.applications = Set<ApplicationToken>([token1, token2])
```

When an app is shielded, iOS displays a full-screen blocking UI when the user tries to open it.

### FamilyActivityPicker

To let users select specific apps (rather than categories), present `ScreenTimePicker.swift`:

```swift
// In a UIViewController
let selection = FamilyActivitySelection()
let picker = UIHostingController(
    rootView: ScreenTimePicker(selection: .constant(selection)) { finalSelection in
        // Store tokens from finalSelection.applicationTokens
    }
)
present(picker, animated: true)
```

### Entitlement Setup

1. In Xcode: **Target → Signing & Capabilities → + Capability → Family Controls**
2. This adds `com.apple.developer.family-controls` to your `.entitlements` file
3. The entitlement is **restricted** — requires approval from Apple: https://developer.apple.com/contact/request/family-controls-entitlement/
4. For development/testing, use your own Apple ID device

### React Native Bridge (Objective-C → Swift)

The `RCT_EXTERN_MODULE` pattern in `ScreenTimeModule.m` registers the Swift class with the React Native bridge:

```objc
// ScreenTimeModule.m — declares methods to bridge layer
RCT_EXTERN_METHOD(blockApps:(NSArray *)bundleIds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
```

```swift
// ScreenTimeModule.swift — actual implementation
@objc func blockApps(_ bundleIds: [String], resolver resolve: ..., rejecter reject: ...) {
    // Swift implementation
}
```

The bridging header (`AIAssistant-Bridging-Header.h`) imports the necessary React Native Objective-C headers into the Swift compilation unit.

---

## Technical Interview Section

### Q: Why Expo bare workflow instead of managed workflow?

The app requires `FamilyControls` and `ManagedSettings` — Apple private frameworks that require custom native code. Expo managed workflow cannot accommodate custom native modules. The bare workflow gives us full Xcode project control while retaining Expo tooling (EAS Build, expo-notifications, expo-blur, etc.).

### Q: Why Zustand over Redux or Context API?

**Redux** adds significant boilerplate (actions, reducers, selectors) that isn't justified for a single-developer app of this scope. **Context API** re-renders all consumers on every state change — problematic for list screens with many cards.

Zustand offers:
- Minimal boilerplate (direct state mutations via `set()`)
- Selective subscriptions (components only re-render when their slice changes)
- No Provider wrapping required
- Built-in async actions
- Easy TypeScript typing

### Q: How does the AI prioritization avoid re-ordering on every keystroke?

AI prioritization is **explicitly user-triggered** (the "AI Sort" button). The result is written back to persistent storage, so the order survives app restarts. This is a deliberate UX decision — users should feel in control of when AI suggestions are applied.

### Q: How is the OpenAI API key secured?

The key is stored in `AsyncStorage`, which on iOS is backed by the app's sandboxed container directory (not the system keychain). For production hardening, the key should be stored in `expo-secure-store` (which uses iOS Keychain Services). The current implementation prioritizes simplicity; the architecture makes swapping storage trivial — only `storageService.ts` would change.

### Q: Explain the notification scheduling lifecycle.

```
addTask()
  └─► scheduleTaskReminder(task)     ← returns notificationId
        └─► Notifications.scheduleNotificationAsync({ trigger: { date } })
              └─► stored in task.notificationId

updateTask()
  └─► if dueDate changed:
        cancelNotification(old notificationId)
        scheduleTaskReminder(updated task)
        update task.notificationId

deleteTask()
  └─► cancelNotification(task.notificationId)
```

This ensures no orphaned notifications accumulate. The 30-minute-before reminder was chosen as a sensible default; per-task reminder configuration could be added as a future enhancement.

### Q: How does the Screen Time tracking work without DeviceActivity?

The app maintains its **own minute counter** in JS via a 1-minute `setInterval`. This is a simplified model — it tracks time the *app* is open, not total device screen time.

A production implementation would:
1. Register a `DeviceActivityMonitor` app extension (a separate iOS target)
2. Use `DeviceActivityCenter.startMonitoring()` with a schedule
3. The extension receives callbacks when thresholds are crossed and can call `ManagedSettingsStore` directly (without needing the main app to be open)

This architecture is why the `getUsageStats()` method in `screenTimeService.ts` is a placeholder — the real data would come from the `DeviceActivityReport` API in a separate extension process.

### Q: Why SVG for the circular progress ring instead of a library?

`react-native-svg` (included transitively via Expo) gives pixel-perfect control. Alternatives like `react-native-circular-progress` add bundle weight and introduce dependencies we don't control. The SVG approach is ~20 lines and requires no additional packages.

### Q: Describe the animation strategy.

Two animation systems are used deliberately:

| Use Case | Library |
|---|---|
| List item entrance, press scale | `react-native-reanimated` (runs on UI thread, 60fps) |
| Header scroll parallax | `Animated` API with `useNativeDriver: true` |

Reanimated's `withSpring` and `withTiming` run entirely on the native thread via JSI, avoiding the bridge bottleneck. The `FadeInDown` entering animation staggers list items with `delay(index * 60)` for a cascade effect.

### Q: What are the main areas for production hardening?

1. **Keychain storage** for OpenAI API key (`expo-secure-store`)
2. **Rate limiting** — debounce AI calls, show estimated token cost
3. **DeviceActivity extension** for real screen time data
4. **iCloud sync** via CloudKit for multi-device task sync
5. **Widget extension** showing top priority task on home screen
6. **Error boundaries** around screens for graceful crash recovery
7. **Accessibility** — VoiceOver labels on all interactive elements
8. **Offline queue** for AI requests that fail due to no connectivity
9. **Background app refresh** to reschedule notifications after reboot

### Q: How would you test this app?

```
Unit tests (Jest):
  - storageService.ts — mock AsyncStorage
  - aiService.ts — mock fetch responses
  - store logic — test state transitions in isolation

Integration tests (Detox):
  - Add task → verify it appears in list
  - Mark complete → verify filtered view updates
  - Settings save → verify persisted across "restart"

Manual E2E:
  - Screen Time blocking on physical device
  - Push notification delivery
  - OpenAI API error handling (wrong key, network offline)
```

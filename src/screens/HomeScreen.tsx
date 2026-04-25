import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Gradients } from '../constants/colors';
import { useTaskStore } from '../store/taskStore';
import { useEventStore } from '../store/eventStore';
import { useSettingsStore } from '../store/settingsStore';
import { useScreenTimeStore } from '../store/screenTimeStore';
import GlassCard from '../components/GlassCard';
import TaskCard from '../components/TaskCard';
import EventCard from '../components/EventCard';

const { width } = Dimensions.get('window');

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { tasks } = useTaskStore();
  const { events } = useEventStore();
  const { settings } = useSettingsStore();
  const scrollY = useRef(new Animated.Value(0)).current;

  const today = new Date().toISOString().split('T')[0];
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const todayEvents = events.filter((e) => e.date.startsWith(today));
  const upcomingTasks = pendingTasks.slice(0, 3);
  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .slice(0, 3);

  const st = settings.screenTimeSettings;
  const screenTimePercent = st.dailyLimitMinutes
    ? Math.min((st.usedMinutesToday / st.dailyLimitMinutes) * 100, 100)
    : 0;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <LinearGradient
            colors={['#4F7BFF22', '#A855F711']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
              <Text style={styles.userName}>{settings.userName}</Text>
            </View>
            <Pressable
              style={styles.avatarButton}
              onPress={() => navigation.navigate('SettingsTab')}
            >
              <LinearGradient colors={Gradients.primary} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {settings.userName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="checkmark-circle"
            value={String(pendingTasks.length)}
            label="Pending"
            color={Colors.primary}
          />
          <StatCard
            icon="calendar"
            value={String(todayEvents.length)}
            label="Today"
            color={Colors.accent}
          />
          <StatCard
            icon="timer"
            value={`${Math.round(screenTimePercent)}%`}
            label="Screen"
            color={screenTimePercent > 80 ? Colors.urgent : Colors.success}
          />
        </View>

        {/* Upcoming Tasks */}
        <SectionHeader
          title="Priority Tasks"
          onSeeAll={() => navigation.navigate('TasksTab')}
        />
        {upcomingTasks.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>🎉 No pending tasks. You're all caught up!</Text>
          </GlassCard>
        ) : (
          upcomingTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() =>
                navigation.navigate('TasksTab', {
                  screen: 'AddTask',
                  params: { taskId: task.id },
                })
              }
            />
          ))
        )}

        {/* Upcoming Events */}
        <SectionHeader
          title="Upcoming Events"
          onSeeAll={() => navigation.navigate('EventsTab')}
        />
        {upcomingEvents.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>📅 No upcoming events scheduled.</Text>
          </GlassCard>
        ) : (
          upcomingEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() =>
                navigation.navigate('EventsTab', {
                  screen: 'AddEvent',
                  params: { eventId: event.id },
                })
              }
            />
          ))
        )}

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
  color: string;
}) {
  return (
    <GlassCard style={styles.statCard}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onSeeAll}>
        <Text style={styles.seeAll}>See all →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  header: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 26,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  avatarButton: { borderRadius: 24 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: 20, marginBottom: 16 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  bottomSpacer: { height: 20 },
});

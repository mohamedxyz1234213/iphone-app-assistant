import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Gradients } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';
import { useScreenTimeStore } from '../store/screenTimeStore';
import { ScreenTimeService } from '../services/screenTimeService';
import GlassCard from '../components/GlassCard';

const { width } = Dimensions.get('window');
const RING_SIZE = 180;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ScreenTimeScreen() {
  const { settings, updateScreenTimeSettings } = useSettingsStore();
  const { triggerBlock, stopBlock } = useScreenTimeStore();
  const st = settings.screenTimeSettings;

  const [countdown, setCountdown] = useState('');

  const progress = st.dailyLimitMinutes
    ? Math.min(st.usedMinutesToday / st.dailyLimitMinutes, 1)
    : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const percentColor =
    progress > 0.9 ? Colors.urgent : progress > 0.7 ? Colors.warning : Colors.primary;

  // Countdown timer for block
  useEffect(() => {
    if (!st.isCurrentlyBlocking || !st.blockUntilTime) {
      setCountdown('');
      return;
    }
    const interval = setInterval(() => {
      const remaining = new Date(st.blockUntilTime!).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown('Ending...');
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${mins}m ${secs}s remaining`);
    }, 1000);
    return () => clearInterval(interval);
  }, [st.isCurrentlyBlocking, st.blockUntilTime]);

  const handleToggleEnabled = (val: boolean) => {
    updateScreenTimeSettings({ enabled: val });
    if (!val && st.isCurrentlyBlocking) {
      stopBlock();
    }
  };

  const handleTestBlock = async () => {
    if (!ScreenTimeService.isAvailable()) {
      Alert.alert(
        'Simulator Only',
        'Screen Time blocking requires a physical iPhone with iOS 16+. This feature uses Apple FamilyControls entitlement.',
        [{ text: 'Got it' }]
      );
      return;
    }
    Alert.alert('Test Block', 'Block social media apps for 1 minute?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block Now',
        onPress: () => triggerBlock('timed', undefined, 1),
      },
    ]);
  };

  const handleStopBlock = async () => {
    Alert.alert('Stop Block', 'Unblock all apps now?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unblock', onPress: () => stopBlock() },
    ]);
  };

  const handleToggleApp = (appId: string) => {
    const updated = st.blockedApps.map((a) =>
      a.id === appId ? { ...a, isSelected: !a.isSelected } : a
    );
    updateScreenTimeSettings({ blockedApps: updated });
  };

  const limitHours = Math.floor(st.dailyLimitMinutes / 60);
  const limitMins = st.dailyLimitMinutes % 60;
  const usedHours = Math.floor(st.usedMinutesToday / 60);
  const usedMins = st.usedMinutesToday % 60;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Screen Time</Text>
          <Switch
            value={st.enabled}
            onValueChange={handleToggleEnabled}
            trackColor={{ false: Colors.cardBorder, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        {/* Circular Progress */}
        <GlassCard style={styles.ringCard}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background circle */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={Colors.cardBorder}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            {/* Progress circle */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={percentColor}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={[styles.ringPercent, { color: percentColor }]}>
              {Math.round(progress * 100)}%
            </Text>
            <Text style={styles.ringUsed}>
              {usedHours}h {usedMins}m used
            </Text>
            <Text style={styles.ringLimit}>
              of {limitHours}h {limitMins}m
            </Text>
          </View>
        </GlassCard>

        {/* Block Status */}
        {st.isCurrentlyBlocking && (
          <GlassCard style={styles.blockingCard}>
            <LinearGradient
              colors={Gradients.screenTime}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="shield" size={24} color={Colors.white} />
            <View style={styles.blockingInfo}>
              <Text style={styles.blockingTitle}>Apps Blocked</Text>
              {countdown ? (
                <Text style={styles.blockingCountdown}>{countdown}</Text>
              ) : (
                <Text style={styles.blockingCountdown}>Until task completed</Text>
              )}
            </View>
            <Pressable onPress={handleStopBlock} style={styles.stopButton}>
              <Text style={styles.stopText}>Unblock</Text>
            </Pressable>
          </GlassCard>
        )}

        {/* Daily Limit */}
        <Text style={styles.sectionTitle}>Daily Limit</Text>
        <GlassCard style={styles.sliderCard}>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderValue}>
              {limitHours}h {limitMins > 0 ? `${limitMins}m` : ''}
            </Text>
          </View>
          <View style={styles.sliderTrack}>
            {[30, 60, 90, 120, 180, 240, 360, 480].map((val) => (
              <Pressable
                key={val}
                style={[
                  styles.sliderPip,
                  st.dailyLimitMinutes === val && styles.sliderPipActive,
                ]}
                onPress={() => updateScreenTimeSettings({ dailyLimitMinutes: val })}
              >
                <Text
                  style={[
                    styles.sliderPipLabel,
                    st.dailyLimitMinutes === val && styles.sliderPipLabelActive,
                  ]}
                >
                  {val >= 60 ? `${val / 60}h` : `${val}m`}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {/* Block Mode */}
        <Text style={styles.sectionTitle}>When Limit Exceeded</Text>
        <View style={styles.modeRow}>
          <Pressable
            style={[
              styles.modeButton,
              st.blockMode === 'task_completion' && styles.modeButtonActive,
            ]}
            onPress={() => updateScreenTimeSettings({ blockMode: 'task_completion' })}
          >
            {st.blockMode === 'task_completion' ? (
              <LinearGradient
                colors={Gradients.primary}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            ) : null}
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={st.blockMode === 'task_completion' ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.modeLabel,
                st.blockMode === 'task_completion' && styles.modeLabelActive,
              ]}
            >
              Until Task Done
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, st.blockMode === 'timed' && styles.modeButtonActive]}
            onPress={() => updateScreenTimeSettings({ blockMode: 'timed' })}
          >
            {st.blockMode === 'timed' ? (
              <LinearGradient
                colors={Gradients.primary}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            ) : null}
            <Ionicons
              name="timer"
              size={20}
              color={st.blockMode === 'timed' ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[styles.modeLabel, st.blockMode === 'timed' && styles.modeLabelActive]}
            >
              Timed Block
            </Text>
          </Pressable>
        </View>

        {/* Timed Duration (if timed mode) */}
        {st.blockMode === 'timed' && (
          <>
            <Text style={styles.sectionTitle}>Block Duration</Text>
            <GlassCard style={styles.sliderCard}>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderValue}>{st.blockDurationMinutes} min</Text>
              </View>
              <View style={styles.sliderTrack}>
                {[15, 30, 45, 60, 90, 120].map((val) => (
                  <Pressable
                    key={val}
                    style={[
                      styles.sliderPip,
                      st.blockDurationMinutes === val && styles.sliderPipActive,
                    ]}
                    onPress={() => updateScreenTimeSettings({ blockDurationMinutes: val })}
                  >
                    <Text
                      style={[
                        styles.sliderPipLabel,
                        st.blockDurationMinutes === val && styles.sliderPipLabelActive,
                      ]}
                    >
                      {val}m
                    </Text>
                  </Pressable>
                ))}
              </View>
            </GlassCard>
          </>
        )}

        {/* App Selection */}
        <Text style={styles.sectionTitle}>Apps to Block</Text>
        <GlassCard>
          {st.blockedApps.map((app, idx) => (
            <View
              key={app.id}
              style={[styles.appRow, idx < st.blockedApps.length - 1 && styles.appRowBorder]}
            >
              <Text style={styles.appIcon}>{app.icon}</Text>
              <Text style={styles.appName}>{app.name}</Text>
              <Switch
                value={app.isSelected}
                onValueChange={() => handleToggleApp(app.id)}
                trackColor={{ false: Colors.cardBorder, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          ))}
        </GlassCard>

        {/* Test Block Button */}
        <Pressable
          style={({ pressed }) => [styles.testButton, pressed && { opacity: 0.8 }]}
          onPress={handleTestBlock}
        >
          <LinearGradient colors={Gradients.screenTime} style={styles.testGradient}>
            <Ionicons name="shield" size={20} color={Colors.white} />
            <Text style={styles.testText}>Test Block Now</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  ringCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
    position: 'relative',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  ringPercent: { fontSize: 36, fontWeight: '800' },
  ringUsed: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  ringLimit: { fontSize: 12, color: Colors.textMuted },
  blockingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderRadius: 16,
  },
  blockingInfo: { flex: 1 },
  blockingTitle: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  blockingCountdown: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  stopButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stopText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
    marginTop: 4,
  },
  sliderCard: { marginBottom: 20 },
  sliderRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  sliderValue: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  sliderTrack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  sliderPip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sliderPipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sliderPipLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  sliderPipLabelActive: { color: Colors.white },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  modeButtonActive: { borderColor: Colors.primary },
  modeLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  modeLabelActive: { color: Colors.white },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  appRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  appIcon: { fontSize: 22, width: 30 },
  appName: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  testButton: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  testGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  testText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  bottomSpacer: { height: 20 },
});

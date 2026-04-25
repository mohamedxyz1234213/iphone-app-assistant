import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';
import { AI_MODELS } from '../constants';
import { NotificationService } from '../services/notificationService';
import GlassCard from '../components/GlassCard';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { settings, updateSettings } = useSettingsStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState(settings.openAiApiKey);
  const [userName, setUserName] = useState(settings.userName);

  const handleSaveProfile = async () => {
    await updateSettings({ userName: userName.trim() || 'Friend', openAiApiKey: apiKey.trim() });
    Alert.alert('Saved', 'Settings updated successfully!');
  };

  const handleNotificationsToggle = async (val: boolean) => {
    if (val) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your iPhone Settings > AI Assistant.'
        );
        return;
      }
    }
    await updateSettings({ notificationsEnabled: val });
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Profile */}
        <SectionLabel>Profile</SectionLabel>
        <GlassCard style={styles.card}>
          <SettingRow label="Your Name">
            <TextInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter your name"
              placeholderTextColor={Colors.textMuted}
            />
          </SettingRow>
        </GlassCard>

        {/* AI Settings */}
        <SectionLabel>AI Configuration</SectionLabel>
        <GlassCard style={styles.card}>
          <SettingRow label="OpenAI API Key">
            <View style={styles.apiKeyRow}>
              <TextInput
                style={[styles.input, styles.apiKeyInput]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-..."
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowApiKey(!showApiKey)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showApiKey ? 'eye-off' : 'eye'}
                  size={18}
                  color={Colors.textSecondary}
                />
              </Pressable>
            </View>
          </SettingRow>

          <View style={styles.divider} />
          <Text style={styles.settingLabel}>AI Model</Text>
          <View style={styles.modelGrid}>
            {AI_MODELS.map((m) => (
              <Pressable
                key={m.value}
                style={[
                  styles.modelButton,
                  settings.aiModel === m.value && styles.modelButtonActive,
                ]}
                onPress={() => updateSettings({ aiModel: m.value })}
              >
                <Text
                  style={[
                    styles.modelLabel,
                    settings.aiModel === m.value && styles.modelLabelActive,
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {/* Notifications */}
        <SectionLabel>Notifications</SectionLabel>
        <GlassCard style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="notifications" size={20} color={Colors.primary} />
              <Text style={styles.toggleLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: Colors.cardBorder, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </GlassCard>

        {/* Screen Time */}
        <SectionLabel>Screen Time</SectionLabel>
        <GlassCard style={styles.card}>
          <Pressable
            style={styles.navRow}
            onPress={() => navigation.navigate('ScreenTimeTab')}
          >
            <View style={styles.toggleInfo}>
              <Ionicons name="timer" size={20} color={Colors.accent} />
              <Text style={styles.toggleLabel}>Screen Time Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </GlassCard>

        {/* Save Button */}
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}
          onPress={handleSaveProfile}
        >
          <Text style={styles.saveText}>Save Changes</Text>
        </Pressable>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>AI Personal Assistant</Text>
          <Text style={styles.appInfoVersion}>Version {appVersion}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  card: { marginBottom: 4 },
  settingRow: { marginBottom: 8 },
  settingLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  apiKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  apiKeyInput: { flex: 1 },
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 12 },
  modelGrid: { flexDirection: 'column', gap: 8 },
  modelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modelButtonActive: { borderColor: Colors.primary, backgroundColor: Colors.glass },
  modelLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  modelLabelActive: { color: Colors.primary, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  appInfo: { alignItems: 'center', marginTop: 32, gap: 4 },
  appInfoText: { fontSize: 14, color: Colors.textMuted },
  appInfoVersion: { fontSize: 12, color: Colors.textMuted },
});

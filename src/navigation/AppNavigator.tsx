import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/colors';

import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import EventsScreen from '../screens/EventsScreen';
import AddEventScreen from '../screens/AddEventScreen';
import ScreenTimeScreen from '../screens/ScreenTimeScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootTabParamList = {
  HomeTab: undefined;
  TasksTab: undefined;
  EventsTab: undefined;
  ScreenTimeTab: undefined;
  SettingsTab: undefined;
};

export type TaskStackParamList = {
  Tasks: undefined;
  AddTask: { taskId?: string } | undefined;
};

export type EventStackParamList = {
  Events: undefined;
  AddEvent: { eventId?: string } | undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const TaskStack = createNativeStackNavigator<TaskStackParamList>();
const EventStack = createNativeStackNavigator<EventStackParamList>();

function TasksNavigator() {
  return (
    <TaskStack.Navigator screenOptions={{ headerShown: false }}>
      <TaskStack.Screen name="Tasks" component={TasksScreen} />
      <TaskStack.Screen name="AddTask" component={AddTaskScreen} />
    </TaskStack.Navigator>
  );
}

function EventsNavigator() {
  return (
    <EventStack.Navigator screenOptions={{ headerShown: false }}>
      <EventStack.Screen name="Events" component={EventsScreen} />
      <EventStack.Screen name="AddEvent" component={AddEventScreen} />
    </EventStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () => (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ),
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused, color, size }) => {
            type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
            const icons: Record<string, [IoniconsName, IoniconsName]> = {
              HomeTab: ['home', 'home-outline'],
              TasksTab: ['checkmark-circle', 'checkmark-circle-outline'],
              EventsTab: ['calendar', 'calendar-outline'],
              ScreenTimeTab: ['timer', 'timer-outline'],
              SettingsTab: ['settings', 'settings-outline'],
            };
            const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
            return (
              <View style={focused ? styles.activeIconContainer : undefined}>
                <Ionicons name={focused ? active : inactive} size={size} color={color} />
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="TasksTab" component={TasksNavigator} options={{ title: 'Tasks' }} />
        <Tab.Screen name="EventsTab" component={EventsNavigator} options={{ title: 'Events' }} />
        <Tab.Screen
          name="ScreenTimeTab"
          component={ScreenTimeScreen}
          options={{ title: 'Screen Time' }}
        />
        <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: 'transparent',
    elevation: 0,
    height: 85,
    paddingBottom: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeIconContainer: {
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 4,
  },
});

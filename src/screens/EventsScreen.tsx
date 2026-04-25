import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { useEventStore } from '../store/eventStore';
import EventCard from '../components/EventCard';
import EmptyState from '../components/EmptyState';
import FloatingActionButton from '../components/FloatingActionButton';

export default function EventsScreen() {
  const navigation = useNavigation<any>();
  const { events } = useEventStore();

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= now);
  const past = events.filter((e) => new Date(e.date) < now);

  const allSorted = [...upcoming, ...past];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
      </View>

      {allSorted.length === 0 ? (
        <EmptyState
          emoji="📅"
          title="No events yet"
          subtitle="Tap + to schedule your first event!"
        />
      ) : (
        <FlatList
          data={allSorted}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
              <EventCard
                event={item}
                dim={new Date(item.date) < now}
                onPress={() => navigation.navigate('AddEvent', { eventId: item.id })}
              />
            </Animated.View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FloatingActionButton
        onPress={() => navigation.navigate('AddEvent')}
        icon="add"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
});

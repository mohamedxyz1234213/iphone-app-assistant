import React from 'react';
import { Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '../constants/colors';

interface AnimatedHeaderProps {
  title: string;
  scrollY: SharedValue<number>;
  style?: ViewStyle;
}

export default function AnimatedHeader({ title, scrollY, style }: AnimatedHeaderProps) {
  const animStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 60], [1, 0.85], 'clamp');
    const translateY = interpolate(scrollY.value, [0, 60], [0, -4], 'clamp');
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <Animated.View style={[styles.container, animStyle, style]}>
      <LinearGradient
        colors={Gradients.header}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Text style={styles.title}>{title}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

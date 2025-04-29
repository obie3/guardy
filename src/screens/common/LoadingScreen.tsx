import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withRepeat,
//   withTiming,
//   Easing,
//   withDelay
// } from 'react-native-reanimated';
import { QrCode } from 'lucide-react-native';

const LoadingScreen = () => {
  const { theme } = useTheme();

  // Animation values
  // const scale = useSharedValue(1);
  // const opacity = useSharedValue(0.6);

  useEffect(() => {
    // Start animations
    // scale.value = withRepeat(
    //   withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
    //   -1, // Infinite repetition
    //   true // Reverse
    // );
    // opacity.value = withRepeat(
    //   withDelay(
    //     100,
    //     withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
    //   ),
    //   -1, // Infinite repetition
    //   true // Reverse
    // );
  }, []);

  // Animated styles
  // const logoStyle = useAnimatedStyle(() => {
  //   return {
  //     //transform: [{ scale: scale.value }],
  //    // opacity: opacity.value,
  //   };
  // });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.primary },
      ]}
    >
      <View style={[styles.logoContainer]}>
        <QrCode size={80} color={theme.colors.primary} />
      </View>
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.spinner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  spinner: {
    marginTop: 20,
  },
});

export default LoadingScreen;

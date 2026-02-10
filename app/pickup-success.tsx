import React, { useEffect } from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ShoppingBag, Home, Star } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../components/ui/text';
import { Button } from '../components/ui/button';
import { hapticFeedback } from '../utils/haptics';
import { playSound } from '../utils/sound';

const { width } = Dimensions.get('window');

export default function PickupSuccessScreen() {
  const router = useRouter();

  // Animation Values
  const scale = useSharedValue(0);
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.5);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.5);

  useEffect(() => {
    // Success Haptic
    hapticFeedback.success();
    playSound('order_pickup');

    // 1. Main Icon Pop
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // 2. Ripple Effect (Ring 1)
    ring1Scale.value = withRepeat(
      withTiming(2, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    ring1Opacity.value = withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    // 3. Ripple Effect (Ring 2 - Delayed)
    setTimeout(() => {
      ring2Scale.value = withRepeat(
        withTiming(2, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      ring2Opacity.value = withRepeat(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    }, 500);
  }, []);

  // Animated Styles
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* --- ANIMATION CONTAINER --- */}
      <View className="items-center justify-center mb-12 relative">
        {/* Ripples */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#10B981',
            },
            ring1Style,
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#10B981',
            },
            ring2Style,
          ]}
        />

        {/* Main Icon */}
        <Animated.View
          style={[
            iconStyle,
            {
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: '#10B981',
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 10,
              shadowColor: '#10B981',
              shadowOpacity: 0.5,
              shadowRadius: 20,
              zIndex: 10,
            },
          ]}
        >
          <Check size={80} color="white" strokeWidth={4} />
        </Animated.View>
      </View>

      {/* --- TEXT CONTENT --- */}
      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        className="items-center space-y-3 px-8"
      >
        <Text className="text-4xl font-black text-white text-center tracking-tighter">
          Order Picked Up!
        </Text>
        <Text className="text-gray-400 text-center text-lg leading-6 font-medium">
          Enjoy your meal! Don't forget to rate your food experience.
        </Text>
      </Animated.View>

      {/* --- REWARD BADGE --- */}
      <Animated.View
        entering={ZoomIn.delay(600).springify()}
        className="mt-10 bg-[#1A1A1A] border border-white/10 px-6 py-4 rounded-3xl flex-row items-center gap-4"
      >
        <View className="w-12 h-12 bg-orange-500/20 rounded-full items-center justify-center">
          <Star size={24} color="#F97316" fill="#F97316" />
        </View>
        <View>
          <Text className="text-orange-500 font-bold text-lg">Z-Points Earned</Text>
          <Text className="text-gray-400 text-xs">Added to your loyalty balance</Text>
        </View>
      </Animated.View>

      {/* --- ACTIONS --- */}
      <View className="absolute bottom-10 w-full px-6 gap-4">
        <Animated.View entering={FadeInDown.delay(900)}>
          <Button
            label="Back to Home"
            size="lg"
            className="bg-white h-16 rounded-2xl"
            labelClasses="text-black font-black text-lg"
            icon={<Home size={20} color="black" />}
            onPress={() => {
              hapticFeedback.medium();
              router.dismissAll();
              router.replace('/(tabs)');
            }}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

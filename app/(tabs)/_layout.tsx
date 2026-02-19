import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform, Text } from 'react-native';
import { Home, ShoppingBag, User, ListOrdered, Crown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useStore } from '../../context/StoreContext';
import { hapticFeedback } from '../../utils/haptics';

// Animated Icon Component
const TabBarIcon = ({ Icon, color, focused }: { Icon: any; color: string; focused: boolean }) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, { damping: 15, stiffness: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      className={`items-center justify-center 
        ${focused ? 'bg-primary/10 rounded-2xl p-2 border border-primary/20 shadow-md shadow-primary/20' : ''}`}
    >
      <Animated.View style={animatedStyle}>
        <Icon size={24} color={color} strokeWidth={focused ? 3 : 2} />
      </Animated.View>
    </View>
  );
};

export default function TabLayout() {
  const { cart } = useStore();
  const insets = useSafeAreaInsets(); // ✅ REQUIRED FIX

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(20, 20, 20, 0.85)',
          borderTopWidth: 0,
          elevation: 0,

          // ✅ THIS FIXES ANDROID 3-BUTTON NAVIGATION
          height: Platform.OS === 'ios' ? 85 : 65 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#6b7280',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="orders"
        listeners={() => ({ tabPress: () => hapticFeedback.selection() })}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={ListOrdered} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        listeners={() => ({ tabPress: () => hapticFeedback.selection() })}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={Home} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="loyalty"
        listeners={() => ({ tabPress: () => hapticFeedback.selection() })}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={Crown} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        listeners={() => ({ tabPress: () => hapticFeedback.selection() })}
        options={{ href: null }}
      />

      <Tabs.Screen
        name="profile"
        listeners={() => ({ tabPress: () => hapticFeedback.selection() })}
        options={{ href: null }}
      />

      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
    </Tabs>
  );
}

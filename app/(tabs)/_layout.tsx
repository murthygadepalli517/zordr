import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform, Text } from 'react-native'; // Added Text to imports
import { Home, ShoppingBag, User, ListOrdered, Crown } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated'; // Changed imports
import { useStore } from '../../context/StoreContext';
import { hapticFeedback } from '../../utils/haptics';

// Animated Icon Component - IMPROVED APPEARANCE
const TabBarIcon = ({ Icon, color, focused }: { Icon: any; color: string; focused: boolean }) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, { damping: 15, stiffness: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // RENDER: Switched to a primary-colored glow/background for active state
  // to give a richer, more unified look with the Cart tab.
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
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(20, 20, 20, 0.85)', // Semi-transparent for glass effect
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#f97316', // Primary Orange
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

import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Bell, Mail, MessageSquare, Info } from 'lucide-react-native';
import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { hapticFeedback } from '../../utils/haptics';
import { useStore } from '../../context/StoreContext';

const NOTIFICATION_SETTINGS = [
  {
    id: 'orders',
    label: 'Order Updates',
    description: 'Get notified when food is ready',
    icon: Bell,
  },
  {
    id: 'promo',
    label: 'Promotions & Deals',
    description: 'Daily offers and discounts',
    icon: Mail,
  },
  { id: 'chat', label: 'Support Messages', description: 'Chat notifications', icon: MessageSquare },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useStore();

  const [enabled, setEnabled] = useState({
    orders: user?.notificationPreferences?.orders ?? true,
    promo: user?.notificationPreferences?.promo ?? true,
    chat: user?.notificationPreferences?.chat ?? false,
  });

  // Sync local state with user profile if it changes externally
  useEffect(() => {
    if (user?.notificationPreferences) {
      setEnabled({
        orders: user.notificationPreferences.orders ?? true,
        promo: user.notificationPreferences.promo ?? true,
        chat: user.notificationPreferences.chat ?? false,
      });
    }
  }, [user?.notificationPreferences]);

  const toggle = (id: string) => {
    hapticFeedback.selection();
    const newState = { ...enabled, [id]: !enabled[id as keyof typeof enabled] };
    setEnabled(newState);
    updateUser({ notificationPreferences: newState });
  };

  return (
    <Layout className="flex-1 bg-black" safeArea>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: '',
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">
          Preferences
        </Text>

        <View className="gap-4">
          {NOTIFICATION_SETTINGS.map((setting) => (
            <View
              key={setting.id}
              className="flex-row items-center justify-between bg-[#1A1A1A] p-5 rounded-[24px] border border-white/5"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center">
                  <setting.icon size={24} color="#FF5500" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-white text-base">{setting.label}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{setting.description}</Text>
                </View>
              </View>

              <Switch
                trackColor={{ false: '#3e3e3e', true: '#FF5500' }}
                thumbColor={'#fff'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => toggle(setting.id)}
                value={enabled[setting.id as keyof typeof enabled]}
              />
            </View>
          ))}
        </View>

        {/* Info Box */}
        <View className="mt-8 bg-blue-500/10 border border-blue-500/20 p-5 rounded-[24px] flex-row gap-4">
          <Info size={24} color="#3B82F6" />
          <View className="flex-1">
            <Text className="text-blue-400 font-bold mb-1">Push Notifications</Text>
            <Text className="text-blue-400/70 text-xs leading-5">
              To receive real-time updates about your order status, ensure push notifications are
              enabled in your device settings.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
}

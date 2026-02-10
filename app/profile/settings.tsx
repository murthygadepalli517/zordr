import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Moon, Globe, Shield, HelpCircle, Info, ChevronRight } from 'lucide-react-native';
import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { hapticFeedback } from '../../utils/haptics';

const SETTINGS_ITEMS = [
  { icon: Moon, label: 'Appearance', value: 'Dark', color: '#6366F1' },
  { icon: Globe, label: 'Language', value: 'English', color: '#10B981' },
  { icon: Shield, label: 'Privacy & Security', value: '', color: '#F59E0B' },
  { icon: HelpCircle, label: 'Help & Support', value: '', color: '#EC4899' },
  { icon: Info, label: 'About Zordr', value: 'v1.0.0', color: '#6B7280' },
];

export default function SettingsScreen() {
  return (
    <Layout className="flex-1 bg-black" safeArea>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: '',
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">
          General
        </Text>

        <View className="gap-3">
          {SETTINGS_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => hapticFeedback.selection()}
              className="flex-row items-center justify-between bg-[#1A1A1A] p-5 rounded-[24px] border border-white/5"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon size={20} color={item.color} />
                </View>
                <Text className="font-bold text-white text-base">{item.label}</Text>
              </View>

              <View className="flex-row items-center gap-3">
                {item.value && (
                  <Text className="text-sm text-gray-500 font-medium">{item.value}</Text>
                )}
                <ChevronRight size={20} color="#4B5563" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="items-center mt-10">
          <Text className="text-gray-600 text-xs">Zordr for Campus • Build 2025.1</Text>
        </View>
      </ScrollView>
    </Layout>
  );
}

import React from 'react';
import { View, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { useStore } from '../../context/StoreContext';
import {
  LogOut,
  ChevronRight,
  User,
  CreditCard,
  Heart,
  Bell,
  Settings,
  Gift,
  Star,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../utils/api';
import { hapticFeedback } from '../../utils/haptics';

// Updated interface matching your logs
interface BackendProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  dietary: string;
  zCoins: number;
  rank: string;
  notificationPreferences?: {
    orders: boolean;
    promo: boolean;
    chat: boolean;
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const store = useStore();
  // Use setLocalUser instead of updateUser
  const { user, stats, authToken, logout, setLocalUser } = store;

  const {
    data: liveUser,
    isLoading,
    error,
    isSuccess,
    isError,
  } = useQuery<BackendProfile>({
    queryKey: ['userProfile'],
    queryFn: () => apiFetch('user/profile', {}, authToken!),
    enabled: store.isAuthenticated,
  });

  // Handle successful profile fetch
  React.useEffect(() => {
    if (isSuccess && liveUser) {
      const needsUpdate =
        liveUser.name !== user?.name ||
        liveUser.email !== user?.email ||
        liveUser.phone !== user?.phone ||
        liveUser.zCoins !== user?.zCoins ||
        liveUser.dietary !== user?.dietaryPreference;

      if (needsUpdate) {
        // FIXED: Use setLocalUser to strictly update local cache without triggering API calls
        setLocalUser({
          name: liveUser.name,
          email: liveUser.email,
          phone: liveUser.phone,
          zCoins: liveUser.zCoins,
          dietaryPreference: liveUser.dietary,
          notificationPreferences: liveUser.notificationPreferences,
        });
      }
    }
  }, [
    isSuccess,
    liveUser,
    setLocalUser,
    user?.name,
    user?.email,
    user?.phone,
    user?.zCoins,
    user?.dietaryPreference,
  ]);

React.useEffect(() => {
  if (!store.isAuthenticated) return; // <-- ignore errors if logged out

  if (isError && error) {
    if (error.message.includes('token')) {
      Alert.alert('Session Expired', 'Please log in again.');
      logout();
    } else {
      console.error('Profile fetch error:', error.message);
    }
  }
}, [isError, error, logout, store.isAuthenticated]);


  const handleLogout = () => {
    hapticFeedback.warning();
    logout();
    router.replace('/(auth)/welcome');
  };

  const MENU_ITEMS = [
    { icon: User, label: 'Personal Information', route: '/profile/personal-info' },
    { icon: Gift, label: 'Coupons & Z-Points', route: '/loyalty' },
    { icon: CreditCard, label: 'Payment Methods', route: '/profile/payments' },
    { icon: Heart, label: 'Dietary Preferences', route: '/profile/dietary-preferences' },
    { icon: Star, label: 'Your Favorites', route: '/profile/favorites' },
    { icon: Bell, label: 'Notifications', route: '/profile/notification-settings' },
    { icon: Settings, label: 'Settings', route: '/profile/settings' },
  ];

  if (isLoading && store.isAuthenticated && !user) {
    return (
      <Layout className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FF5500" />
        <Text className="text-white mt-4">Loading Profile...</Text>
      </Layout>
    );
  }

  if (!store.isAuthenticated || !user) {
    return (
      <Layout className="flex-1 justify-center items-center">
        <Text className="text-white">Please log in.</Text>
      </Layout>
    );
  }

  return (
    <Layout className="flex-1 bg-black" safeArea>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 1. Profile Header */}
        <View className="items-center pt-8 pb-8">
          <View className="relative mb-4">
            <View className="w-28 h-28 rounded-full border-[3px] border-[#FF5500] p-1">
              <Image
                source={{ uri: 'https://github.com/shadcn.png' }}
                className="w-full h-full rounded-full"
              />
            </View>
          </View>

          <Text className="text-2xl font-black text-white mb-1 tracking-tight">
            {user.name || 'Foodie'}
          </Text>
          <Text className="text-gray-500 text-sm font-medium">{user.email || user.phone}</Text>
        </View>

        {/* 2. Stats Cards */}
        <View className="flex-row gap-4 px-6 mb-8">
          <View className="flex-1 bg-[#1A1A1A] py-5 rounded-[24px] items-center justify-center">
            <Text className="text-white text-2xl font-bold mb-1">{stats.weeklyOrders ?? 0}</Text>
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              Orders
            </Text>
          </View>

          <View className="flex-1 bg-[#1A1A1A] py-5 rounded-[24px] items-center justify-center">
            <Text className="text-[#FF5500] text-2xl font-bold mb-1">
              {user.zCoins?.toLocaleString() ?? 0}
            </Text>
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              Z-Coins
            </Text>
          </View>
        </View>

        {/* 3. Menu List */}
        <View className="px-6 gap-3">
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  hapticFeedback.selection();
                  item.route && router.push(item.route as any);
                }}
                activeOpacity={0.7}
                className="flex-row items-center justify-between p-5 bg-[#1A1A1A] rounded-[20px]"
              >
                <View className="flex-row items-center gap-4">
                  <Icon size={22} color="#9CA3AF" strokeWidth={2} />
                  <Text className="font-bold text-white text-base ml-1">{item.label}</Text>
                </View>
                <ChevronRight size={20} color="#4B5563" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="mt-10 mb-6 flex-row items-center justify-center gap-2"
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-red-500 font-bold text-base">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  );
}

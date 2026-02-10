import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Package, Gift, AlertCircle, ChevronRight } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

import { Layout } from '../components/ui/layout';
import { Text } from '../components/ui/text';
import { hapticFeedback } from '../utils/haptics';
import { useStore, Notification } from '../context/StoreContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, fetchNotifications } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticFeedback.medium();
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = async () => {
    hapticFeedback.medium();
    await markAllAsRead();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package size={20} color="#FF5500" />;
      case 'promo':
        return <Gift size={20} color="#10B981" />;
      case 'system':
        return <AlertCircle size={20} color="#3B82F6" />;
      default:
        return <Bell size={20} color="#9CA3AF" />;
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    hapticFeedback.selection();

    // 1. Mark as read (if unread)
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // 2. Navigate based on type and targetId
    if (notification.type === 'order' && notification.targetId) {
      // Redirect to Order Confirmation screen
      router.push({ pathname: '/order-confirmation', params: { orderId: notification.targetId } });
    } else if (notification.type === 'promo' && notification.targetId === 'loyalty') {
      // Redirect to Loyalty/Coupons screen
      router.push('/loyalty');
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Layout className="flex-1" safeArea edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4 border-b border-white/5">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-bold">← Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center justify-between">
          <View>
            <Text variant="h1">Notifications</Text>
            {unreadCount > 0 && (
              <Text variant="muted" className="mt-1">
                {unreadCount} unread
              </Text>
            )}
          </View>

          {notifications.length > 0 && (
            <View className="flex-row items-center gap-2">
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllAsRead}>
                  <Text className="text-sm font-bold text-primary">Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 100, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E11D48" />
        }
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <View key={notification.id}>
              <TouchableOpacity
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.9}
                className={`flex-row gap-4 p-4 rounded-2xl border ${
                  notification.read
                    ? 'bg-[#1A1A1A] border-white/5'
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                {/* Icon */}
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    notification.read ? 'bg-white/5' : 'bg-primary/10'
                  }`}
                >
                  {getIcon(notification.type)}
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-start justify-between mb-1">
                    <Text
                      className={`font-bold flex-1 ${
                        notification.read ? 'text-white' : 'text-primary'
                      }`}
                    >
                      {notification.title}
                    </Text>
                    {!notification.read && (
                      <View className="w-2 h-2 bg-primary rounded-full ml-2 mt-1.5" />
                    )}
                  </View>

                  <Text className="text-sm text-gray-400 mb-2" numberOfLines={2}>
                    {notification.message}
                  </Text>

                  <Text className="text-xs text-gray-500">
                    {formatTime(notification.createdAt)}
                  </Text>
                </View>

                {/* Action */}
                <View className="justify-center">
                  <ChevronRight size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Bell size={48} color="#4B5563" />
            <Text variant="h3" className="mt-4 mb-2">
              No notifications
            </Text>
            <Text variant="muted" className="text-center">
              You're all caught up! Check back later for updates.
            </Text>
          </View>
        )}
      </ScrollView>
    </Layout>
  );
}

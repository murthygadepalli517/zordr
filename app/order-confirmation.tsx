import React, { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import {
  Check,
  ScanLine,
  MapPin,
  Trophy,
  ExternalLink,
  Home,
  Clock,
  ChefHat,
  Bell,
  ArrowLeft,
  Wallet,
  ShieldCheck,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

import { Layout } from '../components/ui/layout';
import { Text } from '../components/ui/text';
import { Button } from '../components/ui/button';
import { useStore } from '../context/StoreContext';
import { hapticFeedback } from '../utils/haptics';
import { apiFetch } from '../utils/api';
import { playSound } from '../utils/sound';

/**
 * Order Confirmation Screen
 *
 * Displays the status of a placed order and provides real-time updates.
 *
 * Key Features:
 * - Real-time status tracking (Pending -> Preparing -> Ready -> Delivered).
 * - Visual feedback with animated icons and colors based on status.
 * - "Scan Order QR" button that appears when the order is 'Ready'.
 * - Loyalty points display.
 * - Auto-redirects to pickup success screen when status is 'completed'.
 */
export default function OrderConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { orders, authToken } = useStore();

  // 1. Retrieve the correct order
  const orderId = params.orderId as string;

  // Try to find in global state first
  const globalOrder = orderId ? orders.find((o) => o.id === orderId) : null;

  // Fetch directly if not found (handles race condition)
  const { data: fetchedOrder, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiFetch(`orders/${orderId}`, {}, authToken || ''),
    enabled: !!orderId && !globalOrder && !!authToken,
    retry: 2,
  });

  const activeOrder = globalOrder || fetchedOrder;

  // --- HOOKS MUST BE UNCONDITIONAL ---

  // Animation Values
  const glowOpacity = useSharedValue(0.4);
  const glowScale = useSharedValue(1);
  const checkmarkScale = useSharedValue(0.8);

  // Dynamic Status Configuration
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'new':
      case 'pending':
      case 'confirmed':
        return {
          title: 'Order Placed!',
          sub: 'Waiting for outlet to accept.',
          icon: <Check size={48} color="white" strokeWidth={4} />,
          color: '#10B981', // Green
        };
      case 'preparing':
        return {
          title: 'Preparing...',
          sub: 'Your food is being prepared.',
          icon: <ChefHat size={48} color="white" strokeWidth={3} />,
          color: '#F97316', // Orange
        };
      case 'ready':
        return {
          title: 'Food is Ready!',
          sub: 'Scan the QR then pick the order.',
          icon: <ScanLine size={48} color="white" strokeWidth={3} />,
          color: '#10B981', // Green
        };
      case 'out_for_delivery':
        return {
          title: 'On the Way!',
          sub: 'Your order is out for delivery.',
          icon: <Clock size={48} color="white" strokeWidth={3} />,
          color: '#A855F7', // Purple
        };
      default:
        return {
          title: 'Order Status',
          sub: 'Check details below.',
          icon: <Clock size={48} color="white" strokeWidth={3} />,
          color: '#6B7280', // Gray
        };
    }
  };

  // Safe values for hooks (even if activeOrder is null)
  const safeStatus = activeOrder?.status || 'pending';
  const statusInfo = getStatusInfo(safeStatus);
  const earnedPoints = activeOrder ? Math.floor(activeOrder.total * 0.1) : 0;

  // 2. AUTO-REDIRECT ON PICKUP
  useEffect(() => {
    if (!activeOrder?.status) return;

    const status = activeOrder.status;

    // Redirect on pickup
    if (status === 'delivered' || status === 'completed') {
      router.replace('/pickup-success');
    }
  }, [activeOrder?.status]);

  // Breathing Glow
  useEffect(() => {
    hapticFeedback.success();

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    checkmarkScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) });
  }, [statusInfo.color]);

  const breathingStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const iconScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  // --- EARLY RETURNS START HERE ---

  // Safety check - MUST BE HERE before accessing activeOrder properties
  if (isLoading) {
    return (
      <Layout className="flex-1 bg-black justify-center items-center" safeArea>
        <Clock size={48} color="#F97316" className="animate-spin mb-4" />
        <Text className="text-white font-bold">Loading order details...</Text>
      </Layout>
    );
  }

  if (!activeOrder) {
    return (
      <Layout className="flex-1 bg-black justify-center items-center" safeArea>
        <Text className="text-white font-bold mb-4">Order not found</Text>
        <Button label="Go Home" onPress={() => router.replace('/(tabs)')} />
      </Layout>
    );
  }

  return (
    <Layout className="flex-1 bg-black" safeArea>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          padding: 24,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        {orderId && (
          <View className="w-full items-start mb-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-white/10"
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

        <View className="h-4" />

        {/* Status Icon */}
        <View className="items-center mb-6 relative justify-center">
          <View
            className="absolute w-24 h-24 rounded-full opacity-30"
            style={{ backgroundColor: statusInfo.color }}
          />
          <Animated.View
            style={[
              iconScaleStyle,
              {
                width: 96,
                height: 96,
                borderRadius: 48,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: statusInfo.color,
                shadowColor: statusInfo.color,
                shadowOpacity: 0.5,
                shadowRadius: 15,
                elevation: 10,
                zIndex: 10,
              },
            ]}
          >
            {statusInfo.icon}
          </Animated.View>
        </View>

        {/* Text Info */}
        <Animated.View entering={FadeInDown.delay(100)} className="items-center space-y-2 mb-10">
          <Text className="text-3xl font-black text-white text-center tracking-tight">
            {statusInfo.title}
          </Text>
          <Text className="text-gray-400 text-center font-medium text-base px-4">
            {statusInfo.sub}
          </Text>
        </Animated.View>

        {/* Z-Points */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          className="w-full mb-10 items-center"
        >
          <View className="relative w-full max-w-[300px] items-center justify-center">
            <Animated.View
              style={[
                breathingStyle,
                {
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(249, 115, 22, 0.25)',
                  borderRadius: 999,
                },
              ]}
            />
            <View className="bg-[#151515] border border-orange-500/40 rounded-full py-3 px-6 flex-row items-center justify-center gap-4 z-10 shadow-lg shadow-orange-900/20 w-full">
              <View className="w-10 h-10 bg-orange-500 rounded-full items-center justify-center shadow-sm">
                <Trophy size={20} color="#1A1A1A" fill="#1A1A1A" />
              </View>
              <View>
                <Text className="text-orange-400 font-black text-xl leading-6">
                  +{earnedPoints} Z-Points
                </Text>
                <Text className="text-orange-500/60 text-[10px] font-bold uppercase tracking-widest">
                  LOYALTY REWARD EARNED
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Order Details Card */}
        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          className="w-full bg-[#1A1A1A] rounded-[32px] p-1 items-center overflow-hidden mb-8 border border-white/5"
        >
          <View className="w-full items-center pt-8 pb-6">
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-[3px] mb-2">
              ORDER ID
            </Text>
            <Text className="text-5xl font-black text-white tracking-tighter">
              #{activeOrder.id.slice(-5).toUpperCase()}
            </Text>
          </View>

          <View className="w-[80%] h-[1px] bg-white/5 mb-8" />

          {/* QR Scanner Button - only visible when order is ready */}
          <TouchableOpacity
            onPress={() => router.push(`/qr-scanner?orderId=${activeOrder.id}`)}
            activeOpacity={0.8}
            className="w-[85%] bg-white rounded-2xl h-14 flex-row items-center justify-center gap-3 shadow-lg mb-6"
          >
            <ScanLine size={20} color="black" />
            <Text className="text-black font-bold text-lg">Scan Order QR</Text>
          </TouchableOpacity>

          <Text className="text-gray-500 text-xs text-center px-12 mb-6 leading-5">
            Found your order? Scan the code on the receipt or bag to confirm pickup.
          </Text>

          <View className="flex-row flex-wrap justify-center gap-3 mb-8 px-4">
            {/* Location */}
            <View className="bg-[#252525] px-4 py-2 rounded-full flex-row items-center gap-2">
              <MapPin size={14} color="#f97316" />
              <Text className="text-gray-300 font-bold text-xs">
                Counter 4 • <Text className="text-white">{activeOrder.outletName}</Text>
              </Text>
            </View>

            {/* Slot */}
            {activeOrder.pickupSlot && (
              <View className="bg-[#252525] px-4 py-2 rounded-full flex-row items-center gap-2">
                <Clock size={14} color="#3b82f6" />
                <Text className="text-gray-300 font-bold text-xs">{activeOrder.pickupSlot}</Text>
              </View>
            )}

            {/* Payment */}
            <View className="bg-[#252525] px-4 py-2 rounded-full flex-row items-center gap-2">
              {activeOrder.paymentMethod === 'COD' ? (
                <Wallet size={14} color="#F59E0B" />
              ) : (
                <ShieldCheck size={14} color="#10B981" />
              )}
              <Text className="text-gray-300 font-bold text-xs">
                {activeOrder.paymentMethod === 'COD' ? 'Pay at Counter' : 'Prepaid'}
              </Text>
            </View>
          </View>

          <View className="w-full bg-red-500/5 border-t border-red-500/10 p-4">
            <Text className="text-[10px] text-red-400/70 text-center leading-4 font-medium">
              Before taking and going check the items are correct or not. Zordr is not responsible
              for any issues related to misplacement.
            </Text>
          </View>
        </Animated.View>

        {/* Sponsored Ad */}
        <Animated.View entering={FadeInDown.delay(700)} className="w-full mb-8">
          <Text className="text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">
            SPONSORED
          </Text>
          <TouchableOpacity
            className="w-full bg-gradient-to-r from-purple-900 to-indigo-900 p-5 rounded-3xl flex-row justify-between items-center border border-white/10 overflow-hidden"
            style={{ backgroundColor: '#4c1d95' }}
          >
            <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
            <View>
              <Text className="text-white font-bold text-lg mb-1">Get 50% Off Movie Tickets</Text>
              <Text className="text-purple-200 text-xs">
                Use code <Text className="font-bold text-white">ZORDR</Text> at Local Cinema
              </Text>
            </View>
            <View className="bg-white/10 p-2 rounded-xl">
              <ExternalLink size={20} color="white" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Back to Home */}
        <Animated.View entering={FadeInDown.delay(900)} className="w-full">
          <Button
            label="Back to Home"
            variant="outline"
            icon={<Home size={18} color="white" />}
            onPress={() => router.replace('/(tabs)')}
            className="border-white/10 h-14"
            labelClasses="text-white font-bold"
          />
        </Animated.View>
      </ScrollView>
    </Layout>
  );
}

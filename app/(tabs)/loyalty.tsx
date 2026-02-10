import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Crown, Coins, Star, Gift, Zap, ArrowLeft, Trophy, Award, Sparkles } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';

import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { useStore, RANKS } from '../../context/StoreContext';
import { MysteryCoupon } from '../../components/MysteryCoupon';
import { hapticFeedback } from '../../utils/haptics';

// Mock Data for Mystery Coupons
const MYSTERY_COUPONS = [
  {
    id: 'c1',
    cost: 50,
    reward: { title: '50% OFF', description: 'On your next pizza order', type: 'discount' } as const,
  },
  {
    id: 'c2',
    cost: 100,
    reward: { title: 'Free Burger', description: 'Classic Z-Burger on us', type: 'free_item' } as const,
  },
  {
    id: 'c3',
    cost: 25,
    reward: { title: '200 Z-Coins', description: 'Instant coin boost!', type: 'coins' } as const,
  },
  {
    id: 'c4',
    cost: 75,
    reward: { title: 'Free Drink', description: 'Any large beverage', type: 'free_item' } as const,
  },
];

export default function LoyaltyScreen() {
  const router = useRouter();
  const { stats } = useStore();
  const currentRankIndex = RANKS.findIndex((r) => r.name === stats.currentRank.name);

  // Local State for Demo
  const [zCoins, setZCoins] = useState(stats.zCoins);
  const [unlockedCoupons, setUnlockedCoupons] = useState<Set<string>>(new Set());

  // Animation values
  const coinScale = useSharedValue(1);

  // Breathing Glow Animation
  const glowOpacity = useSharedValue(0.3);
  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const coinStyle = useAnimatedStyle(() => ({ transform: [{ scale: coinScale.value }] }));

  const handleUnlock = (couponId: string, cost: number) => {
    if (zCoins >= cost) {
      setZCoins((prev) => prev - cost);
      setUnlockedCoupons((prev) => new Set(prev).add(couponId));

      // Animate Coin Deduction
      coinScale.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );

      hapticFeedback.success();
    }
  };

  const getIconComponent = (iconName: string, size: number, color: string) => {
    switch (iconName) {
      case 'Star': return <Star size={size} color={color} fill={color} />;
      case 'Award': return <Award size={size} color={color} />;
      case 'Crown': return <Crown size={size} color={color} />;
      case 'Trophy': return <Trophy size={size} color={color} />;
      default: return <Star size={size} color={color} />;
    }
  };

  return (
    <Layout className="flex-1 bg-black" safeArea>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-6 pt-2 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-[#1A1A1A] rounded-full items-center justify-center border border-white/10"
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-white">Loyalty</Text>
        </View>

        {/* Live Z-Coins Balance */}
        <Animated.View style={[coinStyle]} className="bg-[#1A1A1A] px-4 py-2 rounded-full border border-[#FF5500]/30 flex-row items-center gap-2">
          <Coins size={16} color="#FF5500" fill="#FF5500" />
          <Text className="text-[#FF5500] font-black text-lg">{zCoins}</Text>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}>
        {/* Rank Card with Glow */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mx-6 mb-8 relative">
          <Animated.View style={[glowStyle]} className="absolute inset-0 bg-[#FF5500] rounded-[32px] blur-md" />
          <View className="bg-[#FF5500] p-6 rounded-[32px] relative overflow-hidden border border-white/10">
            {/* Decor */}
            <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
            <View className="absolute -bottom-8 -left-8 w-24 h-24 bg-black/10 rounded-full" />

            <View className="flex-row justify-between items-start mb-8">
              <View>
                <Text className="text-white/80 font-bold text-xs uppercase tracking-widest mb-1">Current Rank</Text>
                <Text className="text-white text-4xl font-black italic">{stats.currentRank.name}</Text>
              </View>
              <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center border border-white/10 backdrop-blur-sm">
                {getIconComponent(stats.currentRank.icon, 32, 'white')}
              </View>
            </View>

            {/* Stats Grid */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-black/20 rounded-2xl p-3 flex-row items-center gap-3 border border-white/5">
                <View className="bg-white/20 p-2 rounded-full">
                  <Coins size={16} color="#FFF" />
                </View>
                <View>
                  <Text className="text-white font-black text-lg leading-5">{zCoins}</Text>
                  <Text className="text-white/60 text-[10px] font-bold uppercase">Balance</Text>
                </View>
              </View>
              <View className="flex-1 bg-black/20 rounded-2xl p-3 flex-row items-center gap-3 border border-white/5">
                <View className="bg-white/20 p-2 rounded-full">
                  <Crown size={16} color="#FFF" />
                </View>
                <View>
                  <Text className="text-white font-black text-lg leading-5">{stats.weeklyOrders}</Text>
                  <Text className="text-white/60 text-[10px] font-bold uppercase">Orders/Wk</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Mystery Coupons Section */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <Sparkles size={20} color="#FF5500" />
            <Text className="text-xl font-bold text-white">Mystery Menu</Text>
          </View>
          <Text className="text-white/60 text-xs mb-6 -mt-2">Use Z-Coins to unlock exclusive foodie rewards!</Text>

          <View className="flex-row flex-wrap gap-3 justify-between">
            {MYSTERY_COUPONS.map((coupon, index) => (
              <Animated.View
                key={coupon.id}
                entering={FadeInDown.delay(300 + index * 100).springify()}
              >
                <MysteryCoupon
                  id={coupon.id}
                  cost={coupon.cost}
                  reward={coupon.reward}
                  isUnlocked={unlockedCoupons.has(coupon.id)}
                  canUnlock={zCoins >= coupon.cost}
                  onUnlock={() => handleUnlock(coupon.id, coupon.cost)}
                />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Rank Tiers */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-white mb-4">Rank Tiers</Text>
          <View className="gap-3">
            {RANKS.map((rank, index) => {
              const isUnlocked = index <= currentRankIndex;
              const isCurrent = index === currentRankIndex;
              return (
                <Animated.View
                  key={rank.name}
                  entering={FadeInDown.delay(500 + index * 100)}
                  className={`flex-row items-center justify-between p-4 rounded-2xl border ${isCurrent ? 'bg-[#1A1A1A] border-[#FF5500]' : isUnlocked ? 'bg-[#1A1A1A] border-white/10' : 'opacity-40 border-white/5'
                    }`}
                >
                  <View className="flex-row items-center gap-4">
                    <View className={`w-12 h-12 rounded-full items-center justify-center ${isCurrent ? 'bg-[#FF5500]/20' : 'bg-white/5'}`}>
                      {getIconComponent(rank.icon, 24, isCurrent ? '#FF5500' : 'white')}
                    </View>
                    <View>
                      <Text className={`font-bold text-lg ${isCurrent ? 'text-[#FF5500]' : 'text-white'}`}>{rank.name}</Text>
                      <Text className="text-xs text-gray-500">{rank.minOrders}+ orders per week</Text>
                    </View>
                  </View>
                  {isCurrent && (
                    <View className="bg-[#FF5500] px-2 py-1 rounded-lg">
                      <Text className="text-white text-[10px] font-bold">CURRENT</Text>
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
}

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  BackHandler,
} from 'react-native';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Layout } from '../../components/ui/layout';
import { ArrowLeft, Trash2, Plus, Minus, Trophy, Ticket, X } from 'lucide-react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useStore } from '../../context/StoreContext';
import { hapticFeedback } from '../../utils/haptics';
import Animated, { FadeInRight, Layout as LayoutAnim } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput, Modal } from 'react-native';

export default function CartScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { cart, updateQuantity, removeFromCart, stats } = useStore();
  const [usePoints, setUsePoints] = useState(false);
const insets = useSafeAreaInsets();
const [orderType, setOrderType] = useState<'Dine In' | 'Takeaway' | null>('Dine In');  // Intercept back gesture to navigate to home
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      router.push('/(tabs)');
    });
    return unsubscribe;
  }, [navigation, router]);

  // Handle Android hardware/gesture back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.push('/(tabs)');
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [router]);


  useFocusEffect(
  useCallback(() => {
    // When screen is focused → do nothing

    return () => {
      // When screen is unfocused (navigating away)
    };
  }, [])
);
  // Constants
  const TAX_RATE = 0.05;
  const POINTS_DISCOUNT_AMOUNT = 50; // Value of discount in Rupees
  const POINTS_COST = 500; // Cost in Z-Coins

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [instructions, setInstructions] = useState('');

  // Available Coupons State
  const [isCouponsModalOpen, setIsCouponsModalOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [cartSnapshot, setCartSnapshot] = useState<string>('');

  // Auto-remove coupon if cart contents change
  useEffect(() => {
    const currentSnapshot = JSON.stringify(cart.map(i => ({ id: i.id, qty: i.quantity })));
    if (appliedCoupon && currentSnapshot !== cartSnapshot) {
      setAppliedCoupon(null);
      setCouponCode('');
      // Optionally notify user
      // Alert.alert('Coupon Removed', 'Coupon was removed because the cart items changed.');
    }
  }, [cart, appliedCoupon, cartSnapshot]);

  // Fetch Available Coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      if (!cart[0]?.outletId) return;
      try {
        const { apiFetch } = require('../../utils/api');
        const token = await AsyncStorage.getItem('authToken');
        // @ts-ignore
        const fetchedCoupons = await apiFetch(`offers/available?outletId=${cart[0].outletId}`, {}, token || '');
        setAvailableCoupons(fetchedCoupons);
      } catch (e) {
        console.log('Error fetching coupons', e);
      }
    };
    fetchCoupons();
  }, [cart]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplyingCoupon(true);
    try {
      const { apiFetch } = require('../../utils/api');
      const token = await AsyncStorage.getItem('authToken');
      // @ts-ignore
      const response = await apiFetch('offers/validate', {
        method: 'POST',
        body: {
          code: couponCode,
          outletId: cart[0]?.outletId,
          orderValue: subtotal
        }
      }, token || '');

      setAppliedCoupon(response);
      setCartSnapshot(JSON.stringify(cart.map(i => ({ id: i.id, qty: i.quantity }))));
      hapticFeedback.success();
      Alert.alert('Success', `Coupon applied! You saved ₹${response.discount}`);
    } catch (error: any) {
      hapticFeedback.error();
      Alert.alert('Invalid Coupon', error.message || 'Could not apply coupon');
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    hapticFeedback.selection();
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const loyaltyDiscount = usePoints ? POINTS_DISCOUNT_AMOUNT : 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  // const total = Math.max(0, subtotal + tax - discount);
    const total = Math.max(0, subtotal  - loyaltyDiscount - couponDiscount);


  const canRedeemPoints = (stats?.zCoins || 0) >= POINTS_COST;

  const handleTogglePoints = () => {
    hapticFeedback.selection();
    if (!usePoints && !canRedeemPoints) {
      Alert.alert(
        'Insufficient Z-Coins',
        `You need ${POINTS_COST} Z-Coins to redeem this discount.`
      );
      return;
    }
    setUsePoints(!usePoints);
  };

  const handleIncrement = (id: string) => {
    hapticFeedback.light();
    updateQuantity(id, 1);
  };

  const handleDecrement = (id: string, qty: number) => {
    hapticFeedback.light();
    if (qty > 1) {
      updateQuantity(id, -1);
    } else {
      removeFromCart(id);
    }
  };

  if (cart.length === 0) {
    return (
      <Layout className="flex-1 justify-center items-center p-6">
        <View className="w-32 h-32 bg-[#1A1A1A] rounded-full items-center justify-center mb-6 border border-white/5">
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11329/11329060.png' }}
            className="w-16 h-16 opacity-50"
            tintColor="#6b7280"
          />
        </View>
        <Text variant="h2" className="text-center mb-2">
          Hungry?
        </Text>
        <Text className="text-gray-500 text-center mb-8">
          Your cart is empty. Add some delicious items from the menu.
        </Text>
        <Button
          label="Browse Menu"
          onPress={() => router.push('/(tabs)')}
          size="lg"
          className="px-10"
        />
      </Layout>
    );
  }

  return (
    <Layout className="flex-1" safeArea>
      {/* Header */}
      <View className="px-6 pt-2 pb-4 flex-row items-center gap-4 border-b border-white/5">
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-white/5"
        >
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-black text-white">My Cart</Text>
        <View className="flex-1 items-end">
          <Text className="text-[#FF5500] font-bold">{cart.length} Items</Text>
        </View>
      </View>

      {/* Increased paddingBottom to 200 to ensure the last item 
                is visible above the floating checkout bar + tab bar 
            */}
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 200 }}>
        {/* Items List */}
        <View className="gap-4 mb-8">
          {cart.map((item) => (
            <Animated.View
              key={item.id}
              layout={LayoutAnim.springify()}
              entering={FadeInRight}
              className="flex-row gap-4 bg-[#1A1A1A] p-3 rounded-[24px] border border-white/5"
            >
              <Image source={{ uri: item.image }} className="w-24 h-24 rounded-2xl bg-gray-800" />

              <View className="flex-1 justify-between py-1">
                <View>
                  <Text className="font-bold text-white text-lg leading-tight mb-1">
                    {item.name}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    ₹{item.price} x {item.quantity}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-[#FF5500] font-black text-lg">
                    ₹{item.price * item.quantity}
                  </Text>

                      <View
                      className="flex-row items-center gap-3 bg-black/40 rounded-full px-3 py-1.5 border"
                      style={{ borderColor: '#FF5500', borderWidth: 1.5 }}
                    >
                    <TouchableOpacity onPress={() => handleDecrement(item.id, item.quantity)}>
                      {item.quantity === 1 ? (
                        <Trash2 size={16} color="#ef4444" />
                      ) : (
                        <Minus size={16} color="white" />
                      )}
                    </TouchableOpacity>
                    <Text className="font-bold text-sm w-4 text-center text-white">
                      {item.quantity}
                    </Text>
                    <TouchableOpacity onPress={() => handleIncrement(item.id)}>
                      <Plus size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Loyalty Reward Card */}
        {/* <TouchableOpacity
          onPress={handleTogglePoints}
          activeOpacity={0.9}
          className={`p-5 rounded-[24px] border mb-6 flex-row items-center justify-between ${
            usePoints
              ? 'bg-[#FF5500]/10 border-[#FF5500]'
              : 'bg-[#1A1A1A] border-dashed border-white/20'
          }`}
        >
          <View className="flex-row items-center gap-4">
            <View
              className={`w-10 h-10 rounded-full items-center justify-center ${usePoints ? 'bg-[#FF5500]' : 'bg-gray-800'}`}
            >
              <Trophy size={20} color={usePoints ? 'white' : '#9CA3AF'} />
            </View>
            <View>
              <Text className={`font-bold ${usePoints ? 'text-[#FF5500]' : 'text-gray-300'}`}>
                Redeem {POINTS_COST} Z-Points
              </Text>
              <Text className="text-xs text-gray-500">
                Save ₹{POINTS_DISCOUNT_AMOUNT} on this order
              </Text>
            </View>
          </View>

          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${usePoints ? 'border-[#FF5500] bg-[#FF5500]' : 'border-gray-600'}`}
          >
            {usePoints && <View className="w-2.5 h-2.5 bg-white rounded-full" />}
          </View>
        </TouchableOpacity> */}


{/* Order Type Selection */}
<View className="mb-6">
  <Text className="font-bold text-white mb-3">Order Type</Text>

  <View className="flex-row gap-4">
    
    {/* Dine In */}
    <TouchableOpacity
      onPress={() => {
        hapticFeedback.selection();
        setOrderType('Dine In');
      }}
      className={`flex-1 p-4 rounded-2xl border flex-row items-center justify-between ${
        orderType === 'Dine In'
          ? 'border-[#FF5500] bg-[#FF5500]/10'
          : 'border-white/10 bg-[#1A1A1A]'
      }`}
    >
      <Text
        className={`font-semibold ${
          orderType === 'Dine In' ? 'text-[#FF5500]' : 'text-gray-300'
        }`}
      >
        Dine In
      </Text>

      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
          orderType === 'Dine In'
            ? 'border-[#FF5500] bg-[#FF5500]'
            : 'border-gray-500'
        }`}
      >
        {orderType === 'Dine In' && (
          <View className="w-2 h-2 bg-white rounded-full" />
        )}
      </View>
    </TouchableOpacity>

    {/* Takeaway */}
    <TouchableOpacity
      onPress={() => {
        hapticFeedback.selection();
        setOrderType('Takeaway');
      }}
      className={`flex-1 p-4 rounded-2xl border flex-row items-center justify-between ${
        orderType === 'Takeaway'
          ? 'border-[#FF5500] bg-[#FF5500]/10'
          : 'border-white/10 bg-[#1A1A1A]'
      }`}
    >
      <Text
        className={`font-semibold ${
          orderType === 'Takeaway' ? 'text-[#FF5500]' : 'text-gray-300'
        }`}
      >
        Takeaway
      </Text>

      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
          orderType === 'Takeaway'
            ? 'border-[#FF5500] bg-[#FF5500]'
            : 'border-gray-500'
        }`}
      >
        {orderType === 'Takeaway' && (
          <View className="w-2 h-2 bg-white rounded-full" />
        )}
      </View>
    </TouchableOpacity>

  </View>
</View>

        {/* Offers & Benefits */}
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
          Offers & Benefits
        </Text>
        <View className="bg-[#1A1A1A] rounded-[24px] border border-white/5 p-4 mb-6">
          <View className="flex-row gap-3 items-center">
            <View className="flex-1">
              <TextInput
                placeholder="Enter Coupon Code"
                placeholderTextColor="#6B7280"
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text);
                  setAppliedCoupon(null);
                }}
                className="bg-black/30 h-12 rounded-xl px-4 text-white font-bold border border-white/5 w-full"
              />
              <TouchableOpacity onPress={() => setIsCouponsModalOpen(true)} className="mt-2 ml-1">
                <Text className="text-[#FF5500] text-xs font-bold underline">View Available Coupons</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={appliedCoupon ? handleRemoveCoupon : handleApplyCoupon}
              disabled={(!couponCode && !appliedCoupon) || isApplyingCoupon}
              className={`h-12 px-6 rounded-xl items-center justify-center ${appliedCoupon ? 'bg-red-500' : 'bg-[#FF5500]'
                }`}
            >
              <Text className="text-white font-bold">
                {isApplyingCoupon ? '...' : appliedCoupon ? 'REMOVE' : 'APPLY'}
              </Text>
            </TouchableOpacity>
          </View>
          {appliedCoupon && (
            <View className="mt-3 flex-row items-center gap-2">
              <Ticket size={14} color="#10b981" />
              <Text className="text-emerald-500 text-xs font-bold">
                '{appliedCoupon.code}' applied! You saved ₹{appliedCoupon.discount.toFixed(0)}
              </Text>
            </View>
          )}
        </View>

        {/* Cooking Instructions */}
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
          Cooking Instructions
        </Text>
        <View className="bg-[#1A1A1A] rounded-[24px] border border-white/5 p-4 mb-8">
          <TextInput
            placeholder="e.g. Less spicy, Extra ketchup..."
            placeholderTextColor="#6B7280"
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
            style={{ color: 'white', textAlignVertical: 'top' }}
            className="text-white text-sm min-h-[60px]"
          />
        </View>

        {/* Bill Details */}
        <View className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 space-y-3">
          <Text className="font-bold text-white mb-2">Order Summary</Text>

          <View className="flex-row justify-between">
            <Text className="text-gray-400">Subtotal</Text>
            <Text className="text-white font-medium">₹{subtotal.toFixed(2)}</Text>
          </View>

          {usePoints && (
            <View className="flex-row justify-between">
              <Text className="text-[#FF5500]">Loyalty Discount</Text>
              <Text className="text-[#FF5500] font-medium">- ₹{loyaltyDiscount.toFixed(2)}</Text>
            </View>
          )}

          {appliedCoupon && (
            <View className="flex-row justify-between">
              <Text className="text-emerald-500">Coupon Discount</Text>
              <Text className="text-emerald-500 font-medium">- ₹{couponDiscount.toFixed(2)}</Text>
            </View>
          )}

          <View className="flex-row justify-between pt-2 items-center">
            <Text className="text-xl font-black text-white">Total</Text>
            <Text className="text-2xl font-black text-[#FF5500]">₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Available Coupons Modal */}
      <Modal
        visible={isCouponsModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCouponsModalOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#1A1A1A] rounded-t-[32px] p-6 h-[70%] border-t border-white/10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-white">Available Coupons</Text>
              <TouchableOpacity onPress={() => setIsCouponsModalOpen(false)} className="p-2 bg-white/10 rounded-full">
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              {availableCoupons.length === 0 ? (
                <Text className="text-gray-500 text-center mt-10">No coupons available for this outlet.</Text>
              ) : (
                availableCoupons.map((coupon: any) => (
                  <TouchableOpacity
                    key={coupon.id}
                    onPress={() => {
                      if (appliedCoupon?.code === coupon.code) {
                        handleRemoveCoupon();
                      } else {
                        setCouponCode(coupon.code);
                        // Optional: Auto apply if you want
                        // handleApplyCoupon(); 
                      }
                      setIsCouponsModalOpen(false);
                    }}
                    className={`bg-black/40 border p-4 rounded-xl mb-3 flex-row justify-between items-center ${
                      appliedCoupon?.code === coupon.code ? 'border-red-500' : 'border-white/5'
                    }`}
                  >
                    <View className="flex-1">
                      <View className="border-dashed border border-[#FF5500] bg-[#FF5500]/10 self-start px-2 py-1 rounded mb-2">
                        <Text className="text-[#FF5500] font-bold text-xs uppercase">{coupon.code}</Text>
                      </View>
                      <Text className="text-white font-bold text-sm mb-1">{coupon.description}</Text>
                      <Text className="text-gray-500 text-[10px]">Min Order: ₹{coupon.minOrderVal}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-white font-bold text-lg">
                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}%` : `₹${coupon.value}`}
                      </Text>
                      <Text className="text-gray-500 text-[10px] mb-2">OFF</Text>
                      <View className={`px-3 py-1 rounded-lg ${appliedCoupon?.code === coupon.code ? 'bg-red-500' : 'bg-[#FF5500]'}`}>
                        <Text className="text-white font-bold text-[10px]">
                          {appliedCoupon?.code === coupon.code ? 'REMOVE' : 'SELECT'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Checkout Bar - Raised to avoid Tab Bar overlap */}
      <View
         className="absolute left-0 right-0 px-6 pt-4 pb-4 bg-black border-t border-white/10"
          style={{ bottom: insets.bottom -20 }}

      >
        <Button
          label={`Checkout • ₹${total.toFixed(0)}`}
          onPress={() => {
             if (!orderType) {
      Alert.alert('Select Order Type', 'Please choose Dine In or Takeaway.');
      return;
    }
            hapticFeedback.success();
          router.push({
  pathname: '/checkout',
  params: {
    orderType: orderType,
    instructions: instructions,
    appliedCoupon: appliedCoupon ? JSON.stringify(appliedCoupon) : null
  }
});
        }}
          size="lg"
          className="bg-[#FF5500]"
          labelClasses="text-white font-bold text-lg"
        />
      </View>
    </Layout>
  );
}

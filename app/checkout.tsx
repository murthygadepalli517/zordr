import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Alert, TextInput, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Clock, Store, Wallet, ShieldCheck, AlertCircle, X } from 'lucide-react-native';

import { Layout } from '../components/ui/layout';
import { Text } from '../components/ui/text';
import { useStore } from '../context/StoreContext';
import { hapticFeedback } from '../utils/haptics';
import { playSound } from '../utils/sound';
import { SlideButton } from '../components/ui/SlideButton';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, placeOrder, orders, getOutletSlots, outlets } = useStore();

  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<
    { time: string; available: boolean; remaining: number; isHighTraffic: boolean,     limit: number; 
 }[]
  >([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Prepaid'>('COD'); // Default COD
  const [instructions, setInstructions] = useState('');
  const [showAllSlots, setShowAllSlots] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  // Available Coupons State
  const [isCouponsModalOpen, setIsCouponsModalOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  // Fetch Available Coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      if (!cart[0]?.outletId) return;
      try {
        const { apiFetch } = require('../utils/api');
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
      const { apiFetch } = require('../utils/api'); // Lazy import to avoid cycle if any
      // @ts-ignore
      const response = await apiFetch('offers/validate', {
        method: 'POST',
        body: {
          code: couponCode,
          outletId: cart[0]?.outletId,
          orderValue: subtotal
        }
      }, (await AsyncStorage.getItem('authToken')) || '');

      setAppliedCoupon(response);
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

  // Load Last Payment Method
  useEffect(() => {
    const loadPaymentPref = async () => {
      try {
        const stored = await AsyncStorage.getItem('lastPaymentMethod');
        if (stored === 'Prepaid' || stored === 'COD') {
          setPaymentMethod(stored);
        }
      } catch (e) {
        console.error('Failed to load payment pref', e);
      }
    };
    loadPaymentPref();
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      if (cart.length > 0 && cart[0].outletId) {
        setIsLoadingSlots(true);

        // Check if all items are ready to pick
        const allReadyToPick = cart.every((item) => item.isReadyToPick);

        // Check if outlet is closed
        const outlet = outlets.find((o) => o.id === cart[0].outletId);
        if (outlet && !outlet.isOpen) {
          setIsLoadingSlots(false);
          Alert.alert(
            'Outlet Closed',
            "The outlet you're ordering from is currently closed. Your cart will be preserved.",
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
          return;
        }

        try {
          const slots = await getOutletSlots(cart[0].outletId);

          // Inject "Pickup Now" if applicable
                          if (allReadyToPick) {
                    const firstSlotLimit = slots[0]?.limit ?? 10; // fallback limit if not provided
                    slots.unshift({
                      time: 'Now',
                      available: true,
                      remaining: firstSlotLimit,
                      isHighTraffic: false,
                      limit: firstSlotLimit,
                    });
                  }


          setTimeSlots(slots);
          // Select first available slot if none selected
          // if (!selectedTime && slots.length > 0) {
          //   const firstAvailable = slots.find((s) => s.available);
          //   if (firstAvailable) setSelectedTime(firstAvailable.time);
          // }
        } catch (error) {
          console.error('Failed to fetch slots', error);
        } finally {
          setIsLoadingSlots(false);
        }
      }
    };
    fetchSlots();
  }, [cart]);

  // Calculate Totals
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.08);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = Math.max(0, subtotal - discount); // Zero Delivery Fee

  const handleOrderSuccess = async () => {
    if (selectedTime) {
      try {
        // Save Preference
        await AsyncStorage.setItem('lastPaymentMethod', paymentMethod);

        const newOrder = await placeOrder(selectedTime, paymentMethod, instructions);
        // Play Success Sound
        await playSound('order_placed');
        // Success - navigate with orderId
        router.replace({ pathname: '/order-confirmation', params: { orderId: newOrder.id } });
      } catch (error: any) {
        console.error('Order placement failed:', error);

        const errorMessage = error.message || 'Unknown error';

        // Check for unavailable item error
        if (errorMessage.includes('not found or unavailable')) {
          // Try to extract ID
          const match = errorMessage.match(/ID ([a-f0-9-]+) not found/);
          let itemName = 'An item';

          if (match && match[1]) {
            const itemId = match[1];
            const cartItem = cart.find((i) => i.id === itemId);
            if (cartItem) {
              itemName = cartItem.name;
            }
          }

          Alert.alert(
            'Item Unavailable',
            `${itemName} is no longer available. Please remove it from your cart to proceed.`,
            [
              { text: 'OK', onPress: () => router.back() }, // Go back to cart
            ]
          );
        } else {
          Alert.alert(
            'Order Failed',
            errorMessage || 'Could not place your order. Please try again.'
          );
        }

        // Re-throw to let SlideButton know it failed
        throw error;
      }
    }
  };

  return (
    <Layout className="flex-1 bg-black" safeArea>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View className="px-6 pt-2 pb-4 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-white/10"
        >
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-black text-white">Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 140 }}>
        {/* SECTION 1: PICKUP DETAILS */}
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
          Pickup Information
        </Text>
        <View className="bg-[#1A1A1A] p-5 rounded-[32px] border border-white/5 mb-8">
          {/* Outlet Info */}
          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-12 h-12 rounded-full bg-[#FF5500]/20 items-center justify-center">
              <Store size={20} color="#FF5500" />
            </View>
            <View>
              <Text className="text-lg font-bold text-white">
                {cart[0]?.outletName || 'Outlet'}
              </Text>
              <Text className="text-gray-400 text-xs">Pickup Location</Text>
            </View>
          </View>

          <View className="h-[1px] bg-white/5 w-full mb-6" />

          {/* Time Info (Dynamic) */}
          <View className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-full bg-blue-500/20 items-center justify-center">
              <Clock size={20} color="#3b82f6" />
            </View>
            <View>
              <Text className="text-lg font-bold text-white">
                {selectedTime || 'Select a time'}
              </Text>
              <Text className="text-gray-400 text-xs">Scheduled Pickup</Text>
            </View>
          </View>
        </View>

        {/* SECTION 2: TIME SELECTOR */}
        <View className="flex-row justify-between items-end mb-3 ml-1">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Select Pickup Slot
          </Text>
          {/* <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-gray-600" />
            <Text className="text-[10px] text-gray-500 font-bold">Grey = High Traffic</Text>
          </View> */}
        </View>

        <View className="flex-row flex-wrap gap-3 mb-4">
          {isLoadingSlots ? (
            <Text className="text-white">Loading slots...</Text>
          ) : timeSlots.length === 0 ? (
            <Text className="text-red-500">No slots available (Outlet Closed)</Text>
          ) : (
      (showAllSlots ? timeSlots : timeSlots.slice(0, 9)).map((slot) => {
        const isSelected = selectedTime === slot.time;

        const remaining = slot.remaining ?? 0;
      const limit = slot.limit ?? 10;

      const bookedPercentage = ((limit - remaining) / limit) * 100;
      const availablePercentage = (remaining / limit) * 100;
        const isFull = remaining === 0 || !slot.available;
        const isLowStock = remaining > 0 && remaining < 5;
        const isHighTraffic = slot.isHighTraffic;

        return (
          <TouchableOpacity
            key={slot.time}
            disabled={isFull}
            onPress={() => {
              hapticFeedback.selection();
              setSelectedTime(slot.time);
            }}
            activeOpacity={0.8}
            className={`w-[30%] h-16 rounded-xl items-center justify-center border relative overflow-hidden ${
        isFull
          ? 'bg-gray-800 border-gray-700 opacity-60'
          : isSelected
          ? 'bg-[#FF5500] border-[#FF5500]'  // FULL ORANGE FILL
          : isHighTraffic
          ? 'bg-[#1A1408] border-orange-500/50'  
          : availablePercentage === 100
          ? 'border-emerald-500 bg-[#1A1A1A]'
          : 'border-white/10 bg-[#1A1A1A]'
      }`}

          >
            {/* Time */}
            <Text
        className={`font-bold z-10 ${
          isFull
            ? 'text-gray-500'
            : isSelected
            ? 'text-white'
            : 'text-white'
        }`}
      >
        {slot.time}
      </Text>


            {/* Sub Text */}
            {!isFull &&  (
            <Text
          className={`text-[9px] mt-1 font-bold z-10 ${
            isSelected
              ? 'text-black/80'  // Visible on orange
              : isLowStock
              ? 'text-red-400'
              : 'text-gray-500'
          }`}
        >
                {isLowStock
                  ? `Only ${remaining} left`
                  : isHighTraffic
        ? `Busy • ${remaining} left`
                  : `${remaining}/${limit} available`}
              </Text>
            )}

            {/* FULL Label */}
            {isFull && (
              <Text className="text-[9px] mt-1 text-gray-500 font-bold">
                FULL
              </Text>
            )}

            {/* High Traffic Badge */}
            {isHighTraffic && !isFull && !isSelected && (
        <View className="absolute top-0 right-0 bg-orange-500 px-2 py-[2px] rounded-bl-lg">
          <Text className="text-[8px] text-black font-black tracking-wide">
            HIGH TRAFFIC
          </Text>
        </View>
      )}


            {/* Availability Bar */}
            {/* Booking Fill Background */}
      {!isFull && bookedPercentage > 0 && (
        <View
          style={{ width: `${bookedPercentage}%` }}
          className={`absolute left-0 top-0 bottom-0 rounded-xl ${
            availablePercentage > 50
              ? 'bg-yellow-500/20'
              : availablePercentage > 10
              ? 'bg-orange-500/25'
              : 'bg-red-500/20'
          }`}
        />
      )}

          </TouchableOpacity>
        );
      })


          )}
        </View>

        {/* Show More Button */}
        {timeSlots.length > 9 && (
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.selection();
              setShowAllSlots(!showAllSlots);
            }}
            className="self-center bg-white/5 px-4 py-2 rounded-full border border-white/10 mb-8"
          >
            <Text className="text-xs font-bold text-primary">
              {showAllSlots ? 'Show Less' : `Show More Slots (+${timeSlots.length - 9})`}
            </Text>
          </TouchableOpacity>
        )}



        {/* SECTION 3.5: OFFERS & COUPONS */}
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
          Offers & Benefits
        </Text>
        <View className="bg-[#1A1A1A] rounded-[24px] border border-white/5 p-4 mb-8">
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
                <Text className="text-primary text-xs font-bold underline">View Available Coupons</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleApplyCoupon}
              disabled={!couponCode || isApplyingCoupon}
              className={`h-12 px-6 rounded-xl items-center justify-center ${appliedCoupon ? 'bg-green-500' : 'bg-primary'
                }`}
            >
              <Text className="text-white font-bold">
                {isApplyingCoupon ? '...' : appliedCoupon ? 'APPLIED' : 'APPLY'}
              </Text>
            </TouchableOpacity>
          </View>
          {appliedCoupon && (
            <View className="mt-3 flex-row items-center gap-2">
              <ShieldCheck size={14} color="#10b981" />
              <Text className="text-emerald-500 text-xs font-bold">
                '{appliedCoupon.code}' applied! You saved ₹{appliedCoupon.discount.toFixed(0)}
              </Text>
            </View>
          )}
        </View>

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
                        setCouponCode(coupon.code);
                        setIsCouponsModalOpen(false);
                        // Optional: Auto apply
                      }}
                      className="bg-black/40 border border-white/5 p-4 rounded-xl mb-3 flex-row justify-between items-center"
                    >
                      <View className="flex-1">
                        <View className="border-dashed border border-primary bg-primary/10 self-start px-2 py-1 rounded mb-2">
                          <Text className="text-primary font-bold text-xs uppercase">{coupon.code}</Text>
                        </View>
                        <Text className="text-white font-bold text-sm mb-1">{coupon.description}</Text>
                        <Text className="text-gray-500 text-[10px]">Min Order: ₹{coupon.minOrderVal}</Text>
                      </View>
                      <View>
                        <Text className="text-white font-bold text-lg">
                          {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}%` : `₹${coupon.value}`}
                        </Text>
                        <Text className="text-gray-500 text-[10px] text-right">OFF</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* SECTION 4: INSTRUCTIONS */}
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

        {/* SECTION 4: PAYMENT METHOD */}
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
          Payment Method
        </Text>

        <View className="gap-3 mb-8">
          {/* COD Option (Prioritized) */}
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.selection();
              setPaymentMethod('COD');
            }}
            activeOpacity={0.8}
            className={`p-5 rounded-[24px] border flex-row items-center justify-between ${paymentMethod === 'COD'
              ? 'bg-[#1A1A1A] border-[#F59E0B]'
              : 'bg-[#1A1A1A] border-white/5'
              }`}
          >
            <View className="flex-row items-center gap-4">
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center ${paymentMethod === 'COD' ? 'bg-[#F59E0B]/20' : 'bg-white/5'
                  }`}
              >
                <Wallet size={24} color={paymentMethod === 'COD' ? '#F59E0B' : '#6B7280'} />
              </View>
              <View>
                <Text
                  className={`text-lg font-bold ${paymentMethod === 'COD' ? 'text-white' : 'text-gray-400'}`}
                >
                  Pay at Counter (COD)
                </Text>
                <Text className="text-gray-500 text-xs">Cash or UPI at Outlet</Text>
              </View>
            </View>
            {paymentMethod === 'COD' && (
              <View className="w-6 h-6 rounded-full bg-[#F59E0B] items-center justify-center">
                <View className="w-2.5 h-2.5 rounded-full bg-black" />
              </View>
            )}
          </TouchableOpacity>

          {/* Prepaid Option */}
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.selection();
              setPaymentMethod('Prepaid');
            }}
            activeOpacity={0.8}
            className={`p-5 rounded-[24px] border flex-row items-center justify-between ${paymentMethod === 'Prepaid'
              ? 'bg-[#1A1A1A] border-[#10B981]'
              : 'bg-[#1A1A1A] border-white/5'
              }`}
          >
            <View className="flex-row items-center gap-4">
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center ${paymentMethod === 'Prepaid' ? 'bg-[#10B981]/20' : 'bg-white/5'
                  }`}
              >
                <ShieldCheck
                  size={24}
                  color={paymentMethod === 'Prepaid' ? '#10B981' : '#6B7280'}
                />
              </View>
              <View>
                <Text
                  className={`text-lg font-bold ${paymentMethod === 'Prepaid' ? 'text-white' : 'text-gray-400'}`}
                >
                  Pay Online (Prepaid)
                </Text>
                <Text className="text-gray-500 text-xs">UPI, Cards, Netbanking</Text>
              </View>
            </View>
            {paymentMethod === 'Prepaid' && (
              <View className="w-6 h-6 rounded-full bg-[#10B981] items-center justify-center">
                <View className="w-2.5 h-2.5 rounded-full bg-black" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* BILL SUMMARY */}
        <View className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400">Item Total</Text>
            <Text className="text-white font-medium">₹{subtotal}</Text>
          </View>
          {/* <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400">Taxes & Charges</Text>
            <Text className="text-white font-medium">₹{tax}</Text>
          </View> */}
          <View className="flex-row justify-between mb-2">
            <Text className="text-success text-xs">Pickup Delivery Fee</Text>
            <Text className="text-success font-medium">FREE</Text>
          </View>
          {appliedCoupon && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-emerald-500 text-xs">Coupon Discount</Text>
              <Text className="text-emerald-500 font-medium">- ₹{appliedCoupon.discount.toFixed(0)}</Text>
            </View>
          )}
          <View className="h-[1px] bg-white/10 my-2" />
          <View className="flex-row justify-between">
            <Text className="text-white font-bold text-lg">Grand Total</Text>
            <Text className="text-[#FF5500] font-bold text-lg">₹{total}</Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-black border-t border-white/10 pb-10">
        {/* Slide to Pay Button */}
        {selectedTime ? (
          <SlideButton amount={total} onSlideSuccess={handleOrderSuccess} />
        ) : (
          <View className="h-16 bg-[#1A1A1A] rounded-[32px] items-center justify-center border border-red-500/30">
            <Text className="text-red-500 font-bold">Please Select a Time Slot</Text>
          </View>
        )}
      </View>
    </Layout >
  );
}

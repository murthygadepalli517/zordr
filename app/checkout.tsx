import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Clock, Store, Wallet, ShieldCheck } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { Layout } from '../components/ui/layout';
// import { Text } from '../components/ui/text';
import { useStore } from '../context/StoreContext';
import { hapticFeedback } from '../utils/haptics';
import { playSound } from '../utils/sound';
import { SlideButton } from '../components/ui/SlideButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import { CustomAlertModal } from '../components/ui/CustomAlertModal';
import { Text } from 'react-native';

export default function CheckoutScreen() {
  const router = useRouter();
  
  const { cart, placeOrder, orders, getOutletSlots, outlets ,user} = useStore();
  const insets = useSafeAreaInsets();
const params = useLocalSearchParams<{
  orderType?: 'Dine In' | 'Takeaway';
  instructions?: string;
  appliedCoupon?: string;
}>();

const orderType = params.orderType;
  const [selectedTime, setSelectedTime] = useState<string | null>(null);


const [showCodAlert, setShowCodAlert] = useState(false);
  
  const [timeSlots, setTimeSlots] = useState<
    { time: string; 
      available: boolean;
       remaining: number;
        isHighTraffic: boolean,
             limit: number;
             startTime: string;
    endTime: string;

 }[]
  >([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Prepaid'>('Prepaid'); // Default UPI
  const [instructions, setInstructions] = useState(params.instructions || '');
  const [showAllSlots, setShowAllSlots] = useState(false);

  // Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    params.appliedCoupon ? JSON.parse(params.appliedCoupon) : null
  );


  const getNextSlot = () => {
  if (!selectedTime || timeSlots.length === 0) return null;

  const currentIndex = timeSlots.findIndex(
    (slot) => `${slot.startTime}-${slot.endTime}` === selectedTime
  );

  if (currentIndex === -1) return null;

  return timeSlots[currentIndex + 1] || null;
};
  

  // Load Last Payment Method
  useEffect(() => {
  const loadPaymentPref = async () => {
    try {
      const stored = await AsyncStorage.getItem('lastPaymentMethod');

      // Only override if stored is Prepaid
      if (stored === 'Prepaid') {
        setPaymentMethod('Prepaid');
      }

      // If stored is COD → ignore and keep Prepaid default
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

//   const handleOrderSuccess = async () => {
//     if (selectedTime) {
//       try {
//         // Save Preference
//         await AsyncStorage.setItem('lastPaymentMethod', paymentMethod);

//         const newOrder = await placeOrder(selectedTime, paymentMethod, instructions,  appliedCoupon?.code   // ✅ only sends if applied
// );
//         // Play Success Sound
//         await playSound('order_placed');
//         // Success - navigate with orderId
//         router.replace({ pathname: '/order-confirmation', params: { orderId: newOrder.id } });
//       } catch (error: any) {
//         console.error('Order placement failed:', error);

//         const errorMessage = error.message || 'Unknown error';

//         // Check for unavailable item error
//         if (errorMessage.includes('not found or unavailable')) {
//           // Try to extract ID
//           const match = errorMessage.match(/ID ([a-f0-9-]+) not found/);
//           let itemName = 'An item';

//           if (match && match[1]) {
//             const itemId = match[1];
//             const cartItem = cart.find((i) => i.id === itemId);
//             if (cartItem) {
//               itemName = cartItem.name;
//             }
//           }

//           Alert.alert(
//             'Item Unavailable',
//             `${itemName} is no longer available. Please remove it from your cart to proceed.`,
//             [
//               { text: 'OK', onPress: () => router.back() }, // Go back to cart
//             ]
//           );
//         } else {
//           Alert.alert(
//             'Order Failed',
//             errorMessage || 'Could not place your order. Please try again.'
//           );
//         }

//         // Re-throw to let SlideButton know it failed
//         throw error;
//       }
//     }
//   };


const handleOrderSuccess = async () => {
  if (!selectedTime) return;

  try {
    await AsyncStorage.setItem('lastPaymentMethod', paymentMethod);

    const backendPaymentMethod =
  paymentMethod === 'COD' ? 'COD' : 'UPI';

    // 1️⃣ Create Order in your DB
    const newOrder = await placeOrder(
      selectedTime,
      backendPaymentMethod,
      instructions,
      appliedCoupon?.code,
        orderType

    );

    // 2️⃣ If COD → Done
    if (paymentMethod === 'COD') {
      await playSound('order_placed');
      router.replace({
        pathname: '/order-confirmation',
        params: { orderId: newOrder.id },
      });
      return;
    }

    // 3️⃣ If Prepaid → Create Razorpay Order
    const { apiFetch } = require('../utils/api');

    const paymentOrder = await apiFetch(
      'payments/create-order',
      {
        method: 'POST',
        body: { orderId: newOrder.id },
      },
      await AsyncStorage.getItem('authToken') || ''
    );

    // 4️⃣ Open Razorpay
    const options = {
      description: 'Campus Food Order',
      image: 'https://yourlogo.com/logo.png',
      currency: 'INR',
      key: 'rzp_test_S7KeATm2fFOCTu', // ✅ ONLY KEY ID
      amount: paymentOrder.amount,
      order_id: paymentOrder.razorpayOrderId,
      name: 'Zordr',
      prefill: {
        email: user?.email,
        contact: user?.phone,
        name: user?.name,
      },
      theme: { color: '#FF5500' },
    };

    RazorpayCheckout.open(options)
      .then(async (data: any) => {
        // 5️⃣ Verify Payment
        await apiFetch(
          'payments/verify',
          {
            method: 'POST',
            body: {
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
              orderId: newOrder.id,
            },
          },
          await AsyncStorage.getItem('authToken') || ''
        );

        await playSound('order_placed');

        router.replace({
          pathname: '/order-confirmation',
          params: { orderId: newOrder.id },
        });
      })
      .catch((error: any) => {
  router.replace({
    pathname: '/payment-failed',
    params: { orderId: newOrder.id }
  });
});

  } catch (error: any) {
    Alert.alert(
      'Order Failed',
      error.message || 'Could not place your order.'
    );
    throw error;
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
        // const isSelected = selectedTime === slot.time;

        const isSelected =
  selectedTime === `${slot.startTime}-${slot.endTime}`;

        const remaining = slot.remaining ?? 0;
      const limit = slot.limit ?? 10;

      const bookedPercentage = ((limit - remaining) / limit) * 100;
      const availablePercentage = (remaining / limit) * 100;
        const isFull = remaining === 0 || !slot.available;
        const isLowStock = remaining > 0 && remaining < 5;

       // default green

let borderColorClass = 'border-[#10B981]'; // emerald default

if (isFull) {
  borderColorClass = 'border-[#374151]'; // gray-700
} else if (bookedPercentage >= 80) {
borderColorClass = 'border-red-500/30';
} else if (bookedPercentage >= 50) {
  borderColorClass = 'border-[#F59E0B]'; // yellow-500
} else {
  borderColorClass = 'border-[#10B981]'; // emerald-500
}
        const isHighTraffic = slot.isHighTraffic;

        return (
          <TouchableOpacity
            key={slot.time}
            disabled={isFull}
            onPress={() => {
              hapticFeedback.selection();
  setSelectedTime(`${slot.startTime}-${slot.endTime}`);
            }}
            activeOpacity={0.8}
            className={`w-[30%] h-16 rounded-xl items-center justify-center border relative overflow-hidden ${
  isFull
    ? 'bg-gray-800 opacity-60 border-gray-700'
    : isSelected
    ? 'bg-[#FF5500] border-[#FF5500]'
    : `bg-[#1A1A1A] ${borderColorClass}`
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
        {/* {slot.time} */}

        {slot.startTime && slot.endTime
    ? `${slot.startTime} - ${slot.endTime}`
    : slot.time}
      </Text>


            {/* Sub Text */}
            {!isFull && (
  <Text
    className={`text-[9px] mt-1 font-bold z-10 ${
      isSelected
        ? 'text-black/80'
        : isLowStock
        ? 'text-red-400'
        : 'text-gray-500'
    }`}
  >
    {isLowStock
      ? `Only ${remaining} left`
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

        {/* SECTION 4: PAYMENT METHOD */}
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
          Payment Method
        </Text>

        <View className="gap-3 mb-8">
          {/* COD Option (Prioritized) */}
          <TouchableOpacity
           onPress={() => {
  hapticFeedback.selection();

  // If a slot is selected → show alert
  if (selectedTime) {
    setShowCodAlert(true);
  } else {
    setPaymentMethod('COD');
  }
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
      <View 
        style={{ paddingBottom: 20 + insets.bottom }}

      className="absolute bottom-0 left-0 right-0 p-6 bg-black border-t border-white/10 pb-10">
        {/* Slide to Pay Button */}
        {selectedTime ? (
          <SlideButton amount={total} onSlideSuccess={handleOrderSuccess} />
        ) : (
          <View className="h-16 bg-[#1A1A1A] rounded-[32px] items-center justify-center border border-red-500/30">
            <Text className="text-red-500 font-bold">Please Select a Time Slot</Text>
          </View>
        )}
      </View>

<CustomAlertModal
  visible={showCodAlert}
  type="warning"
  title="Confirm COD Timing"
 message={
  (() => {
    const nextSlot = getNextSlot();

    return nextSlot
      ? `You are choosing Cash on Delivery. Your selected slot (${selectedTime}) will be used for PAYMENT. Pickup will be scheduled in the NEXT slot (${nextSlot.startTime} - ${nextSlot.endTime}). Do you want to continue with COD or switch to Prepaid?`
      : `You are choosing Cash on Delivery. Your selected slot (${selectedTime}) will be used for PAYMENT. No further pickup slots are available. Please switch to Prepaid or choose an earlier slot.`;
  })()
}
  onClose={() => setShowCodAlert(false)}
  buttons={[
    {
      text: 'Switch to Prepaid',
      style: 'cancel',
      onPress: () => {
        setPaymentMethod('Prepaid');
      },
    },
    {
      text: 'Continue COD',
      style: 'destructive',
      onPress: () => {
        setPaymentMethod('COD');
      },
    },
  ]}
/>

      
    </Layout >



  );
}

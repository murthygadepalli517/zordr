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
import { ArrowLeft, Trash2, Plus, Minus, Trophy, Ticket } from 'lucide-react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useStore } from '../../context/StoreContext';
import { hapticFeedback } from '../../utils/haptics';
import Animated, { FadeInRight, Layout as LayoutAnim } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function CartScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { cart, updateQuantity, removeFromCart, stats } = useStore();
  const [usePoints, setUsePoints] = useState(false);
const insets = useSafeAreaInsets();

  // Intercept back gesture to navigate to home
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

  // Constants
  const TAX_RATE = 0.05;
  const POINTS_DISCOUNT_AMOUNT = 50; // Value of discount in Rupees
  const POINTS_COST = 500; // Cost in Z-Coins

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const discount = usePoints ? POINTS_DISCOUNT_AMOUNT : 0;
  // const total = Math.max(0, subtotal + tax - discount);
    const total = Math.max(0, subtotal  - discount);


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
              <Text className="text-[#FF5500] font-medium">- ₹{discount.toFixed(2)}</Text>
            </View>
          )}

          {/* <View className="flex-row justify-between pb-3 border-b border-white/10">
            <Text className="text-gray-400">Tax (5%)</Text>
            <Text className="text-white font-medium">₹{tax.toFixed(2)}</Text>
          </View> */}

          <View className="flex-row justify-between pt-2 items-center">
            <Text className="text-xl font-black text-white">Total</Text>
            <Text className="text-2xl font-black text-[#FF5500]">₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Bar - Raised to avoid Tab Bar overlap */}
      <View
         className="absolute left-0 right-0 px-6 pt-4 pb-4 bg-black border-t border-white/10"
          style={{ bottom: insets.bottom -20 }}

      >
        <Button
          label={`Checkout • ₹${total.toFixed(0)}`}
          onPress={() => {
            hapticFeedback.success();
            router.push('/checkout');
          }}
          size="lg"
          className="bg-[#FF5500]"
          labelClasses="text-white font-bold text-lg"
        />
      </View>
    </Layout>
  );
}

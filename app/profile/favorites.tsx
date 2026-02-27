import React from 'react';
import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Heart, Star, Plus, Minus, ArrowLeft, ShoppingBag, ChevronRight } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  Layout as ReanimatedLayout,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../context/StoreContext';
import { Text } from '../../components/ui/text';
import { hapticFeedback } from '../../utils/haptics';

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    favoriteItems,
    toggleFavorite,
    addToCart,
    cart,
    updateQuantity,
  } = useStore();

  const getCartItem = (id: string) => {
    return cart.find((c) => c.id === id);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* HEADER */}
        <View className="px-6 pt-2 pb-4 flex-row items-center gap-4 border-b border-white/5">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-white/10"
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-white">Your Favorites</Text>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 140,
          }}
        >
          {favoriteItems.length > 0 ? (
            <View className="flex-row flex-wrap justify-between">
              {favoriteItems.map((item, index) => {
                const cartItem = getCartItem(item.id);
                const inCart = !!cartItem;
                const quantity = cartItem?.quantity || 0;

                return (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.delay(index * 80).springify()}
                    layout={ReanimatedLayout.springify()}
                    className="w-[48%] mb-4"
                  >
                    <View className="bg-[#1A1A1A] rounded-[24px] overflow-hidden border border-white/5 shadow-lg">

                      {/* IMAGE */}
                      <View className="h-36 w-full relative bg-gray-900">
                        <Image
                          source={{ uri: item.image }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />

                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            hapticFeedback.medium();
                            toggleFavorite(String(item.id));
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full items-center justify-center"
                        >
                          <Heart size={14} color="#ef4444" fill="#ef4444" />
                        </TouchableOpacity>

                        <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg flex-row items-center gap-1">
                          <Star size={10} color="#eab308" fill="#eab308" />
                          <Text className="text-white text-[10px] font-bold">
                            {item.rating ?? 4.5}
                          </Text>
                        </View>
                      </View>

                      {/* CONTENT */}
                      <View className="p-4">
                        <Text
                          className="text-white font-bold text-base mb-1"
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>

                        <Text className="text-gray-500 text-xs mb-3">
                          {item.outletName}
                        </Text>

                        <View className="flex-row items-center justify-between">
                          <Text
                            className="text-primary font-bold text-lg"
                            style={{ marginRight: 12 }}  // ← adjust 10–16 if needed
                          >
                            ₹{item.price}
                          </Text>

                          {!inCart ? (
                            <TouchableOpacity
                              onPress={async (e) => {
                                e.stopPropagation();
                                hapticFeedback.selection();
                                await addToCart(item, 1);
                              }}
                              className="bg-primary px-4 py-2 rounded-full"
                            >
                              <Text className="text-white text-xs font-bold">
                                ADD
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            // <View className="flex-row items-center bg-primary rounded-lg overflow-hidden">
                            //   <TouchableOpacity
                            //     onPress={(e) => {
                            //       e.stopPropagation();
                            //       hapticFeedback.light();
                            //       updateQuantity(item.id, -1);
                            //     }}
                            //     className="w-7 h-7 items-center justify-center"
                            //   >
                            //     <Minus size={14} color="white" />
                            //   </TouchableOpacity>

                            //   <View className="px-3 h-7 bg-black items-center justify-center">
                            //     <Text className="font-bold text-sm text-white">
                            //       {quantity}
                            //     </Text>
                            //   </View>

                            //   <TouchableOpacity
                            //     onPress={(e) => {
                            //       e.stopPropagation();
                            //       hapticFeedback.light();
                            //       updateQuantity(item.id, 1);
                            //     }}
                            //     className="w-7 h-7 items-center justify-center"
                            //   >
                            //     <Plus size={14} color="white" />
                            //   </TouchableOpacity>
                            // </View>

                           <View className="flex-row items-center gap-3 bg-black/40 rounded-full px-3 py-1.5 border border-white/5">
  
  {/* MINUS */}
  <TouchableOpacity
    onPress={(e) => {
      e.stopPropagation();
      hapticFeedback.light();
      updateQuantity(item.id, -1); // SAME LOGIC
    }}
  >
    <Minus size={16} color="white" />
  </TouchableOpacity>

  {/* QUANTITY */}
  <Text className="font-bold text-sm w-4 text-center text-white">
    {quantity}
  </Text>

  {/* PLUS */}
  <TouchableOpacity
    onPress={(e) => {
      e.stopPropagation();
      hapticFeedback.light();
      updateQuantity(item.id, 1); // SAME LOGIC
    }}
  >
    <Plus size={16} color="white" />
  </TouchableOpacity>

</View>
                          )}
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <View className="items-center justify-center py-32">
              <Heart size={40} color="#374151" />
              <Text className="text-2xl font-bold text-white mt-6 mb-2">
                No Favorites Yet
              </Text>
              <Text className="text-gray-500 text-center px-10">
                Start exploring and save your top picks.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* 🔥 EXACT SAME FLOATING CART AS HOME */}
      {cart.length > 0 && (
        <Animated.View
          entering={FadeInDown.springify().damping(15)}
          exiting={FadeOutDown.springify().damping(15)}
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: insets.bottom,
            backgroundColor: '#ea580c',
            borderRadius: 24,
            shadowColor: '#ea580c',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
            zIndex: 9999,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.selection();
              router.push('/(tabs)/cart');
            }}
            activeOpacity={0.9}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingBag size={20} color="#fff" />
              </View>

              <View>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </Text>
                <Text style={{ color: '#fff', fontSize: 12 }}>
                  Tap to view cart
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
                ₹{totalPrice.toFixed(0)}
              </Text>
              <ChevronRight size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

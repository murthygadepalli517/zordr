import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image, TextInput, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Search, Star, Plus, Minus, Store } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
} from 'react-native-reanimated';
import { Text } from '../../components/ui/text';
import { Layout } from '../../components/ui/layout';
import { useStore } from '../../context/StoreContext';
import { hapticFeedback } from '../../utils/haptics';
import ItemDetailsDrawer from '../../components/ItemDetailsDrawer';

const { width } = Dimensions.get('window');

const CATEGORIES = ['Burgers', 'Pizza', 'Sushi', 'Bowls', 'Drinks', 'Dessert'];

const MENU_ITEMS: Record<string, any[]> = {
  Burgers: [
    {
      id: 1,
      name: 'Truffle Wagyu',
      price: 450,
      rating: 4.9,
      desc: 'Black truffle mayo, aged cheddar',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400',
      outletId: 'gourmet-kitchen',
    },
    {
      id: 2,
      name: 'Classic Smash',
      price: 250,
      rating: 4.7,
      desc: 'Double patty, american cheese',
      image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=400',
      outletId: 'gourmet-kitchen',
    },
    {
      id: 3,
      name: 'Crispy Chicken',
      price: 280,
      rating: 4.6,
      desc: 'Spicy slaw, pickles, brioche',
      image: 'https://images.unsplash.com/photo-1615297728668-8243c1c008e9?q=80&w=1000',
      outletId: 'gourmet-kitchen',
    },
  ],
  Pizza: [
    {
      id: 4,
      name: 'Margherita',
      price: 350,
      rating: 4.8,
      desc: 'San Marzano tomato, basil',
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=400',
      outletId: 'gourmet-kitchen',
    },
  ],
  Sushi: [
    {
      id: 6,
      name: 'Dragon Roll',
      price: 550,
      rating: 4.9,
      desc: 'Eel, cucumber, avocado',
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=400',
      outletId: 'gourmet-kitchen',
    },
  ],
  Bowls: [
    {
      id: 8,
      name: 'Acai Super',
      price: 350,
      rating: 4.8,
      desc: 'Berries, granola, honey',
      image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=400',
      outletId: 'gourmet-kitchen',
    },
  ],
  Drinks: [
    {
      id: 9,
      name: 'Yuzu Lemonade',
      price: 150,
      rating: 4.9,
      desc: 'Sparkling japanese citrus',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000',
      outletId: 'gourmet-kitchen',
    },
  ],
  Dessert: [
    {
      id: 10,
      name: 'Mochi Ice Cream',
      price: 250,
      rating: 4.8,
      desc: 'Green tea, mango, strawberry',
      image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=1000',
      outletId: 'gourmet-kitchen',
    },
  ],
};

export default function MenuScreen() {
  const router = useRouter();
  const { outletId } = useLocalSearchParams();
  const { cart, addToCart, updateQuantity, outlets, inventory = {} } = useStore();

  const [activeCategory, setActiveCategory] = useState('Burgers');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const outlet = outlets.find((o) => o.id === outletId);
  const currentItems = MENU_ITEMS[activeCategory] || MENU_ITEMS['Burgers']; // Fallback
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Parallax Header Animation
  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [-300, 0, 300], [-150, 0, 150], Extrapolation.CLAMP),
      },
      { scale: interpolate(scrollY.value, [-300, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));

  if (!outlet) return null;

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back Button Overlay */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-6 z-50 w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/10 backdrop-blur-md"
      >
        <ArrowLeft size={20} color="white" />
      </TouchableOpacity>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        stickyHeaderIndices={[2]} // Sticky Category Bar
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 0. Parallax Image Header */}
        <View className="h-72 w-full overflow-hidden bg-gray-900 relative">
          <Animated.Image
            source={{ uri: outlet.image }}
            className="w-full h-full"
            style={imageAnimatedStyle}
          />
          <View className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          {/* Outlet Info Overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black to-transparent">
            <Text className="text-4xl font-black text-white mb-1">{outlet.name}</Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center bg-white/10 px-2 py-1 rounded-lg">
                <Star size={14} color="#EAB308" fill="#EAB308" />
                <Text className="text-white font-bold ml-1">{outlet.rating}</Text>
              </View>
              <Text className="text-gray-400 text-xs">• {outlet.campus}</Text>
              <View
                className={`px-2 py-1 rounded-lg border ${outlet.isOpen ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase ${outlet.isOpen ? 'text-green-500' : 'text-red-500'}`}
                >
                  {outlet.isOpen ? 'Open Now' : 'Closed'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 1. Spacer */}
        <View className="h-4" />

        {/* 2. Sticky Category Bar */}
        <View className="bg-black py-4 z-10">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  hapticFeedback.selection();
                  setActiveCategory(cat);
                }}
                className={`px-5 py-2.5 rounded-full border ${activeCategory === cat ? 'bg-[#FF5500] border-[#FF5500]' : 'bg-[#1A1A1A] border-white/5'}`}
              >
                <Text
                  className={`font-bold ${activeCategory === cat ? 'text-white' : 'text-gray-400'}`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 3. Menu Items */}
        <View className="px-6 gap-4">
          {currentItems?.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(index * 50).springify()}>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.selection();
                  setSelectedItem({ ...item, outletId: outlet.id });
                  setIsDrawerOpen(true);
                }}
                activeOpacity={0.9}
                className="flex-row bg-[#1A1A1A] p-3 rounded-[24px] border border-white/5"
              >
                <Image source={{ uri: item.image }} className="w-28 h-28 rounded-2xl bg-gray-800" />
                <View className="flex-1 ml-4 justify-between py-1">
                  <View>
                    <Text className="text-white font-bold text-lg mb-1">{item.name}</Text>
                    <Text className="text-gray-500 text-xs leading-4" numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-[#FF5500] font-black text-lg">₹{item.price}</Text>
                    <View className="w-8 h-8 bg-white rounded-full items-center justify-center">
                      <Plus size={18} color="black" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.ScrollView>

      {/* View Cart Floating Button */}
      {totalItems > 0 && (
        <Animated.View
          entering={FadeInDown.springify()}
          className="absolute bottom-8 left-6 right-6"
        >
          <TouchableOpacity
            onPress={() => router.push('/cart')}
            className="w-full h-16 bg-[#FF5500] rounded-[24px] flex-row items-center justify-between px-6 shadow-lg shadow-orange-500/30"
          >
            <View className="flex-row items-center gap-3">
              <View className="bg-black/20 w-8 h-8 rounded-full items-center justify-center">
                <Text className="text-white font-bold">{totalItems}</Text>
              </View>
              <Text className="text-white font-bold text-lg">View Cart</Text>
            </View>
            <Text className="text-white font-bold">Checkout</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ItemDetailsDrawer
        item={selectedItem}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAddToCart={(id, qty) => addToCart(selectedItem, qty)}
      />
    </View>
  );
}

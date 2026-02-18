import React from 'react';
import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Heart, Star, Plus, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown, Layout as ReanimatedLayout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../context/StoreContext';
import { Text } from '../../components/ui/text';
import { hapticFeedback } from '../../utils/haptics';

// Mock Data


export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteItems, toggleFavorite, addToCart } = useStore();


  const handleAddToCart = (item: any) => {
    hapticFeedback.success();
    addToCart(item, 1);
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={['top']} className="flex-1 bg-black">
        {/* Custom Header - Positioned correctly within Safe Area */}
        <View className="px-6 pt-2 pb-4 flex-row items-center gap-4 border-b border-white/5 bg-black z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-white/10"
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-white">Your Favorites</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {favoriteItems.length > 0 ? (
            <View className="flex-row flex-wrap justify-between">
              {favoriteItems.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                  layout={ReanimatedLayout.springify()}
                  className="w-[48%] mb-4"
                >
                  <TouchableOpacity
                    className="bg-[#1A1A1A] rounded-[24px] overflow-hidden border border-white/5 shadow-lg"
                    activeOpacity={0.9}
                    onPress={() => handleAddToCart(item)}
                  >
                    <View className="h-36 w-full relative bg-gray-900">
                      <Image
                        source={{ uri: item.image }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />

                      {/* Favorite Button */}
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          hapticFeedback.light();
                          toggleFavorite(item.id);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/40 rounded-full items-center justify-center backdrop-blur-md border border-white/10"
                      >
                        <Heart size={14} color="#ef4444" fill="#ef4444" />
                      </TouchableOpacity>

                      {/* Rating Pill */}
                      <View className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex-row items-center gap-1 border border-white/10">
                        <Star size={10} color="#eab308" fill="#eab308" />
                        <Text className="text-white text-[10px] font-bold">{item.rating}</Text>
                      </View>
                    </View>

                    <View className="p-4">
                      <Text
                        className="text-white font-bold text-base mb-1 leading-5"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text className="text-gray-500 text-xs mb-3">{item.outletName}</Text>

                      <View className="flex-row items-center justify-between">
                        <Text className="text-[#FF5500] font-black text-lg">₹{item.price}</Text>
                        <View className="w-8 h-8 bg-white rounded-full items-center justify-center">
                          <Plus size={16} color="black" strokeWidth={3} />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-32">
              <View className="w-24 h-24 bg-[#1A1A1A] rounded-full items-center justify-center mb-6 border border-white/5">
                <Heart size={40} color="#374151" />
              </View>
              <Text className="text-2xl font-bold text-white mb-2">No Favorites Yet</Text>
              <Text className="text-gray-500 text-center px-10 leading-6">
                Start exploring our menu and save your top picks for quick ordering.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)')}
                className="mt-8 bg-[#FF5500] px-8 py-3 rounded-2xl"
              >
                <Text className="text-white font-bold">Browse Menu</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

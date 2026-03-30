import React from 'react';
import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Heart, Star, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, MenuItem } from '../../context/StoreContext';
import { Text } from '../../components/ui/text';
import { hapticFeedback } from '../../utils/haptics';

export default function FavoritesScreen() {
  const { favoriteItems, toggleFavorite, addToCart, cart, updateQuantity } = useStore();

  const handleAddToCart = (item: any) => {
    hapticFeedback.medium();
    addToCart(item, 1);
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-6 py-4 border-b border-white/5 mb-2">
          <Text variant="h2">Favorites</Text>
          <Text className="text-gray-400 text-sm mt-1">{favoriteItems.length} saved items</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          {favoriteItems.length > 0 ? (
            <View className="flex-row flex-wrap gap-4 justify-between">
              {favoriteItems.map((item: MenuItem) => {
                const cartItem = cart.find((c) => c.id === item.id);
                const inCart = !!cartItem;
                const quantity = cartItem?.quantity || 0;
                
                const isSoldOut = 
                  (item.inventoryCount !== undefined && item.dailyLimit !== undefined && item.inventoryCount >= item.dailyLimit && item.dailyLimit > 0) ||
                  (item.dailyLimit !== undefined && item.inventoryCount !== undefined && (item.dailyLimit - item.inventoryCount) <= 0 && item.dailyLimit > 0);
                  
                const maxAvailable = (item.dailyLimit || 0) - (item.inventoryCount || 0);
                const canIncrement = item.dailyLimit === undefined || quantity < maxAvailable;
                
                return (
                  <View key={item.id} className="w-[47%] mb-4">
                    <TouchableOpacity
                      className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/5"
                      onPress={() => !isSoldOut && handleAddToCart(item)}
                      activeOpacity={isSoldOut ? 1 : 0.8}
                    >
                      <View className="h-32 w-full relative">
                        <Image
                          source={{ uri: item.image }}
                          className={`w-full h-full ${isSoldOut ? 'opacity-40' : ''}`}
                          resizeMode="cover"
                        />
                        {isSoldOut && (
                          <View className="absolute inset-0 items-center justify-center">
                            <View className="bg-black/70 px-2 py-1 rounded-md border border-white/20">
                              <Text className="text-[10px] text-white font-black">SOLD OUT</Text>
                            </View>
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            hapticFeedback.light();
                            toggleFavorite(item.id);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center backdrop-blur-sm"
                        >
                          <Heart size={16} color="#ef4444" fill="#ef4444" />
                        </TouchableOpacity>
                        <View className="absolute bottom-2 left-2 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded flex-row items-center gap-1">
                          <Star size={10} color="#eab308" fill="#eab308" />
                          <Text className="text-white text-[10px] font-bold">{item.rating || '4.5'}</Text>
                        </View>
                      </View>

                      <View className="p-3">
                        <Text className="text-white font-bold text-sm mb-0.5" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-gray-500 text-[10px] mb-3">{item.outletName || 'Outlet'}</Text>

                        <View className="flex-row items-center justify-between">
                          <Text className="text-primary font-bold">₹{item.price}</Text>
                          
                          {inCart ? (
                            <View className="flex-row items-center gap-2 bg-black/40 rounded-full px-2 py-1 border border-primary/30">
                              <TouchableOpacity 
                                onPress={(e) => {
                                  e.stopPropagation();
                                  hapticFeedback.light();
                                  updateQuantity(item.id, -1);
                                }}
                              >
                                {quantity === 1 ? (
                                  <Minus size={12} color="#ef4444" />
                                ) : (
                                  <Minus size={12} color="white" />
                                )}
                              </TouchableOpacity>
                              <Text className="text-white text-[10px] font-bold w-4 text-center">{quantity}</Text>
                              <TouchableOpacity 
                                onPress={(e) => {
                                  if (!canIncrement) return;
                                  e.stopPropagation();
                                  hapticFeedback.light();
                                  updateQuantity(item.id, 1);
                                }}
                                disabled={!canIncrement}
                              >
                                <Plus size={12} color={canIncrement ? "white" : "#4b5563"} />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity 
                              onPress={(e) => {
                                if (isSoldOut) return;
                                e.stopPropagation();
                                hapticFeedback.selection();
                                handleAddToCart(item);
                              }}
                              disabled={isSoldOut}
                              className={`px-3 py-1.5 rounded-full ${isSoldOut ? 'bg-gray-700' : 'bg-primary'}`}
                            >
                              <Text className="text-white text-[10px] font-bold">{isSoldOut ? 'SOLD OUT' : 'ADD'}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <View className="w-24 h-24 bg-white/5 rounded-full items-center justify-center mb-6">
                <Heart size={48} color="#374151" />
              </View>
              <Text variant="h3" className="mb-2">
                No Favorites Yet
              </Text>
              <Text className="text-gray-500 text-center px-10">
                Tap the heart icon on any item to save it here for quick access.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

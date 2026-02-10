import React from 'react';
import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Heart, Star, Plus, ShoppingBag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../context/StoreContext';
import { Text } from '../../components/ui/text';
import { hapticFeedback } from '../../utils/haptics';

// Mock Data for mapping IDs back to objects (In a real app, you'd fetch these or store full objects)
const ALL_ITEMS = [
  {
    id: 1,
    name: 'Egg Puff',
    price: 25,
    rating: 4.8,
    category: 'Snacks',
    outletName: 'Campus Bakery',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1000',
    desc: 'Hot and spicy bakery puff',
  },
  {
    id: 2,
    name: 'Masala Dosa',
    price: 50,
    rating: 4.7,
    category: 'Breakfast',
    outletName: 'Main Canteen',
    image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?q=80&w=1000',
    desc: 'Crispy dosa',
  },
  {
    id: 3,
    name: 'Cold Coffee',
    price: 60,
    rating: 4.6,
    category: 'Drinks',
    outletName: 'Fresh Juice Bar',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b5dd7359?q=80&w=1000',
    desc: 'Thick chocolate',
  },
  {
    id: 4,
    name: 'Chicken Burger',
    price: 220,
    rating: 4.9,
    category: 'Burgers',
    outletName: 'Main Canteen',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000',
    desc: 'Juicy grilled chicken',
  },
  {
    id: 101,
    name: 'Chicken Biryani Combo',
    price: 180,
    rating: 4.5,
    outletName: 'Main Canteen',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000',
    desc: 'Hyderabadi style dum biryani',
  },
];

export default function FavoritesScreen() {
  const { favorites, toggleFavorite, addToCart } = useStore();

  // Filter all items to find those in the favorites list
  const favoriteItems = ALL_ITEMS.filter((item) => favorites.includes(item.id));

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
              {favoriteItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="w-[47%] bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/5 mb-4"
                  onPress={() => handleAddToCart(item)}
                >
                  <View className="h-32 w-full relative">
                    <Image
                      source={{ uri: item.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
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
                      <Text className="text-white text-[10px] font-bold">{item.rating}</Text>
                    </View>
                  </View>

                  <View className="p-3">
                    <Text className="text-white font-bold text-sm mb-0.5" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-gray-500 text-[10px] mb-3">{item.outletName}</Text>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-primary font-bold">₹{item.price}</Text>
                      <View className="w-7 h-7 bg-white/10 rounded-full items-center justify-center">
                        <Plus size={14} color="white" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
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

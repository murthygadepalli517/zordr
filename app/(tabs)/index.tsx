import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import {
  Search,
  Filter,
  MapPin,
  Crown,
  Clock,
  ChevronRight,
  Heart,
  Star,
  Check,
  ChevronDown,
  X,
  User,
  Plus,
  Minus,
  ShoppingBag,
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
  FadeOutUp,
  FadeOutDown,
  Layout,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeIn,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useStore } from '../../context/StoreContext';
import { hapticFeedback } from '../../utils/haptics';
import { Text } from '../../components/ui/text';
import ItemDetailsDrawer from '../../components/ItemDetailsDrawer';
import { AnimatedItem } from '../../components/AnimatedItem';
import { ReadyToPickRibbon } from '../../components/ReadyToPickRibbon';
import { usePrepTime } from '../../components/PrepTimeProgressBar';
import { ActiveOrderCard } from '../../components/ActiveOrderCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const { width } = Dimensions.get('window');

const FILTER_OPTIONS = [
  { id: 'under-200', label: 'Under ₹200' },
  { id: 'high-rating', label: 'Rated 4.5+' },
  { id: 'deals', label: 'Best Deals' },
  {id: 'veg', label: 'Veg Only' },
  {id: 'non-veg', label: 'Non-Veg Only' },
];



const ONE_SET_WIDTH = (200 + 12) * 4;

export default function HomeScreen() {
  const router = useRouter();
  const {
    stats,
    orders,
    outlets,
    selectedCampus,
    addToCart,
    cart,
    updateQuantity,
    favorites,
    toggleFavorite,
    menuItems,
    deals,
    fetchMenuItems,
    fetchDeals,
    isAuthenticated,
    setActiveOutletId,
      activeOutletId,
    isMenuLoading,
    refreshApp,
    categories,
  } = useStore();
const { user } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [banners, setBanners] = useState<Banner[]>([]);
const [bannerIndex, setBannerIndex] = useState(0);


const bannerScrollRef = useRef<ScrollView | null>(null);

  const [isOutletDropdownOpen, setIsOutletDropdownOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
const insets = useSafeAreaInsets();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await refreshApp();
    setRefreshing(false);
  }, [refreshApp]);

  type Banner = {
  id: string;
  title: string | null;
  imageUrl: string;
  targetUrl: string | null;
  type: string;
  isActive: boolean;
  order: number;
  link: string | null;
  image: string;
  bannerType: string;
  bannerTitle: string | null;
};

  // const campusOutlets = outlets.filter((o) => o.campus === selectedCampus);

  const campusOutlets = outlets;

  const chevronRotation = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const dealsScrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const isInteracting = useRef(false);
  const showShimmer = isMenuLoading && menuItems.length === 0;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });


  const fetchBanners = async () => {
  try {
    const res = await fetch(
      'https://zordr-backend.onrender.com/api/banners?type=home'
    );
    const json = await res.json();

    if (json.success) {
      setBanners(json.data || []);
    }
  } catch (err) {
    console.log('Banner fetch error:', err);
  }
};

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(scrollY.value, [0, 60], [0, -20], Extrapolation.CLAMP) },
      ],
    };
  });

  useFocusEffect(
    useCallback(() => {
      Keyboard.dismiss();
    }, [])
  );

  useEffect(() => {
  fetchBanners();
}, []);


useEffect(() => {
  if (!banners.length) return;

  const interval = setInterval(() => {
    const nextIndex = (bannerIndex + 1) % banners.length;

    bannerScrollRef.current?.scrollTo({
      x: nextIndex * width,
      animated: true,
    });

    setBannerIndex(nextIndex);
  }, 3000);

  return () => clearInterval(interval);
}, [bannerIndex, banners]);

 useEffect(() => {
  if (campusOutlets.length === 0) return;

  const isActiveOutletValid = campusOutlets.some(
    (outlet) => outlet.id === activeOutletId
  );

  // Only set default if current outlet is invalid
  if (!isActiveOutletValid) {
    setActiveOutletId(campusOutlets[0].id);
  }
}, [selectedCampus, campusOutlets]);
  useEffect(() => {
    if (activeOutletId && isAuthenticated) {
      console.log('📥 Setting active outlet:', activeOutletId);
      setActiveOutletId(activeOutletId);
    }
  }, [activeOutletId, isAuthenticated]);

  useEffect(() => {
    let animationFrameId: number;
    const scrollLoop = () => {
      if (!isInteracting.current && dealsScrollRef.current) {
        scrollX.current += 0.6;
        if (scrollX.current >= ONE_SET_WIDTH) {
          scrollX.current -= ONE_SET_WIDTH;
          dealsScrollRef.current.scrollTo({ x: scrollX.current, animated: false });
        } else {
          dealsScrollRef.current.scrollTo({ x: scrollX.current, animated: false });
        }
      }
      animationFrameId = requestAnimationFrame(scrollLoop);
    };
    animationFrameId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleDealsScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.current = event.nativeEvent.contentOffset.x;
  };
  const onDealsScrollBeginDrag = () => {
    isInteracting.current = true;
  };
  const onDealsScrollEndDrag = () => {
    setTimeout(() => (isInteracting.current = false), 100);
  };
  const onDealsMomentumScrollEnd = () => {
    isInteracting.current = false;
  };

  const activeOrders = orders.filter((o) =>
    ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
  );

  const [activeOrderIndex, setActiveOrderIndex] = useState(0);

  const handleActiveOrderScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveOrderIndex(roundIndex);
  };

  function ShimmerCard() {
  return (
    <View className="mb-4 bg-[#1A1A1A] p-3 rounded-[24px] border border-white/5 flex-row gap-4">
      <View className="w-28 h-28 rounded-2xl bg-[#2A2A2A]" />

      <View className="flex-1 justify-between py-1">
        <View>
          <View className="h-4 bg-[#2A2A2A] rounded w-2/3 mb-2" />
          <View className="h-3 bg-[#2A2A2A] rounded w-3/4 mb-2" />
          <View className="h-3 bg-[#2A2A2A] rounded w-1/2" />
        </View>

        <View className="h-5 bg-[#2A2A2A] rounded w-1/4 mt-3" />
      </View>
    </View>
  );
}

  const toggleDropdown = () => {
    hapticFeedback.light();
    const willOpen = !isOutletDropdownOpen;
    if (willOpen) {
      Keyboard.dismiss();
      setIsFilterMenuOpen(false);
    }
    setIsOutletDropdownOpen(willOpen);
    chevronRotation.value = withTiming(willOpen ? 180 : 0, { duration: 200 });
  };

  const toggleFilterMenu = () => {
    hapticFeedback.light();
    const willOpen = !isFilterMenuOpen;
    if (willOpen) {
      Keyboard.dismiss();
      setIsOutletDropdownOpen(false);
      chevronRotation.value = withTiming(0, { duration: 200 });
    }
    setIsFilterMenuOpen(willOpen);
  };

  const closeAllMenus = () => {
    if (isOutletDropdownOpen) toggleDropdown();
    if (isFilterMenuOpen) setIsFilterMenuOpen(false);
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  // Filtering Logic
  const dynamicDeals = deals;
  const filteredDeals = React.useMemo(() =>
    activeCategory === 'All'
      ? dynamicDeals
      : dynamicDeals.filter((item) => item.category === activeCategory),
    [activeCategory, dynamicDeals]);

  const loopedDeals = React.useMemo(() => [...filteredDeals, ...filteredDeals, ...filteredDeals], [filteredDeals]);

  const dynamicItems = React.useMemo(() => menuItems.map((item) => ({
    ...item,
    desc: item.description,
    rating: item.rating || 4.5,
    outletName: outlets.find((o) => o.id === item.outletId)?.name || 'Unknown',
  })), [menuItems, outlets]);

  const filteredItems = React.useMemo(() => dynamicItems.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    let matchesBase = false;


const showShimmer = isMenuLoading && menuItems.length === 0;

    if (searchQuery.length > 0) {
      matchesBase = matchesCategory && item.name.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      matchesBase = matchesCategory && (item.outletId === activeOutletId || !activeOutletId);
    }

    if (!matchesBase) return false;
    if (activeFilter === 'under-200') return item.price < 200;
    if (activeFilter === 'high-rating') return (item.rating || 0) >= 4.5;
    if (activeFilter === 'deals') return false;
    if (activeFilter === 'veg') return item.isVeg === true;
    if (activeFilter === 'non-veg')  return item.isVeg === false;

    return true;
  }), [dynamicItems, activeCategory, searchQuery, activeOutletId, activeFilter]);

  const openItemDetails = (item: any) => {
    hapticFeedback.selection();
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={closeAllMenus}>
          <View className="flex-1 bg-transparent">
            <SafeAreaView edges={['top']} className="flex-1 bg-transparent">
              <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                stickyHeaderIndices={[1]}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={closeAllMenus}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#f97316"
                    colors={['#f97316']}
                    progressBackgroundColor="#1A1A1A"
                  />
                }
              >
                {/* HEADER */}
               <Animated.View
  style={[
    headerAnimatedStyle,
    {
      paddingHorizontal: 24,
      paddingBottom: 16,
      zIndex: 1000,
      elevation: 1000,
    },
  ]}
>
                  <View className="flex-row justify-between items-center">
                    <View className="relative z-50">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-[10px] font-bold text-muted-foreground uppercase">
                          Ordering From
                        </Text>
                        <View className="bg-primary/10 px-2 py-0.5 rounded">
                          <Text className="text-[10px] font-bold text-primary">
                            {selectedCampus}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleDropdown();
                        }}
                        activeOpacity={0.7}
                        className="flex-row items-center gap-1"
                      >
                        <MapPin size={16} className="text-primary" color="#f97316" />
                        <Text
                          className="text-primary max-w-[200px] text-base font-semibold"
                          numberOfLines={1}
                        >
                          {outlets.find((o) => o.id === activeOutletId)?.name || 'Select Outlet'}
                        </Text>
                        <Animated.View style={chevronStyle}>
                          <ChevronDown size={16} color="#f97316" />
                        </Animated.View>
                      </TouchableOpacity>

                      {isOutletDropdownOpen && (
                        <Animated.View
                          entering={FadeInDown.duration(200)}
                          exiting={FadeOutUp.duration(150)}
                          className="absolute top-full left-0 mt-2 w-64 bg-[#1A1A1A] rounded-2xl border border-white/10 shadow-2xl shadow-black z-50 p-1"
                          style={{ elevation: 20 }}
                        >
                          {campusOutlets.map((outlet) => (
                            <TouchableOpacity
                              key={outlet.id}
                              onPress={(e) => {
                                e.stopPropagation();
                                Keyboard.dismiss();
                                if (outlet.isOpen) {
                                  setActiveOutletId(outlet.id);
                                  toggleDropdown();
                                  setSearchQuery('');
                                } else {
                                  // Show alert for closed outlet
                                  hapticFeedback.medium();
                                  Alert.alert(
                                    'Outlet Currently Closed',
                                    'This outlet is temporarily closed. Please select another outlet or try again later.',
                                    [{ text: 'OK' }]
                                  );
                                }
                              }}
                              className={`flex-row justify-between items-center p-3 rounded-xl mb-1 ${activeOutletId === outlet.id ? 'bg-white/10' : 'bg-transparent'} ${!outlet.isOpen ? 'opacity-50' : ''}`}
                            >
                              <View className="flex-row items-center gap-3">
                                <View
                                  className={`w-2 h-2 rounded-full ${outlet.isOpen ? 'bg-green-500' : 'bg-red-500'}`}
                                />
                                <Text
                                  className={`font-medium text-xs ${activeOutletId === outlet.id ? 'text-white font-bold' : 'text-gray-300'}`}
                                >
                                  {outlet.name}
                                </Text>
                              </View>
                              {activeOutletId === outlet.id && <Check size={14} color="#f97316" />}
                            </TouchableOpacity>
                          ))}
                        </Animated.View>
                      )}
                    </View>

                    <View className="flex-row items-center gap-3 mt-1">
                      <View className="flex-row items-center bg-orange-500/20 px-4 py-2 rounded-full">
                        <Crown size={18} color="#f97316" />
                        <Text className="text-orange-500 text-sm font-bold ml-1.5">
                          {stats.currentRank.name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push('/profile')}
                        className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden"
                      >
                       <Image
                          source={{
                            uri: user?.profileImage || 'https://github.com/shadcn.png',
                          }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>



                {/* STICKY BAR (Search + Filter + Categories) */}
                <View className="pb-0 pt-0 z-10">
                  <View className="bg-black pb-4 pt-2 border-b border-white/5 w-full">
                    <View className="px-6 mb-4 flex-row gap-3 z-50">
                      <View
                        className={`flex-1 h-12 bg-[#1A1A1A] border rounded-xl flex-row items-center px-4 ${isOutletDropdownOpen ? 'border-white/5 opacity-50' : 'border-white/10'}`}
                      >
                        <Search size={18} color="#6b7280" />
                        <TextInput
                          placeholder="Search food..."
                          placeholderTextColor="#6b7280"
                          className="flex-1 ml-3 text-white font-medium"
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          editable={!isOutletDropdownOpen}
                        />
                      </View>

                      <View className="relative z-50">
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleFilterMenu();
                          }}
                          className={`w-12 h-12 rounded-xl items-center justify-center border ${activeFilter || isFilterMenuOpen ? 'bg-primary border-primary' : 'bg-[#1A1A1A] border-white/10'}`}
                        >
                          {isFilterMenuOpen ? (
                            <X size={20} color="white" />
                          ) : (
                            <Filter size={18} color={activeFilter ? 'white' : '#fff'} />
                          )}
                        </TouchableOpacity>

                        {isFilterMenuOpen && (
                          <Animated.View
                            entering={FadeInDown.duration(200)}
                            exiting={FadeOutUp.duration(150)}
                            className="absolute top-full right-0 mt-2 w-48 bg-[#1A1A1A] rounded-2xl border border-white/10 shadow-2xl shadow-black z-50 p-1"
                            style={{ elevation: 20 }}
                          >
                            {FILTER_OPTIONS.map((option) => (
                              <TouchableOpacity
                                key={option.id}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  hapticFeedback.selection();
                                  setActiveFilter(activeFilter === option.id ? null : option.id);
                                  setIsFilterMenuOpen(false);
                                }}
                                className={`flex-row justify-between items-center p-3 rounded-xl mb-1 ${activeFilter === option.id ? 'bg-white/10' : 'bg-transparent'}`}
                              >
                                <Text
                                  className={`font-medium text-sm ${activeFilter === option.id ? 'text-white font-bold' : 'text-gray-300'}`}
                                >
                                  {option.label}
                                </Text>
                                {activeFilter === option.id && <Check size={14} color="#f97316" />}
                              </TouchableOpacity>
                            ))}
                          </Animated.View>
                        )}
                      </View>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
                    >
                      {categories.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => {
                            hapticFeedback.selection();
                            setActiveCategory(cat);
                            scrollX.current = 0;
                            dealsScrollRef.current?.scrollTo({ x: 0, animated: true });
                          }}
                          className={`px-5 py-2.5 rounded-full border ${activeCategory === cat ? 'bg-primary border-primary' : 'bg-[#1A1A1A] border-white/5'}`}
                        >
                          <Text
                            className={
                              activeCategory === cat ? 'text-white font-bold' : 'text-gray-400'
                            }
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>



                  {banners.length > 0 && (
  <View className="mt-3">
    <ScrollView
      ref={bannerScrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={(e) => {
        const index = Math.round(
          e.nativeEvent.contentOffset.x / width
        );
        setBannerIndex(index);
      }}
    >
      {banners.map((banner) => (
        <TouchableOpacity
          key={banner.id}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: banner.imageUrl || banner.image }}
            style={{
              width: width,
              height: 160,
            }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </ScrollView>

    {/* Pagination dots */}
    <View className="flex-row justify-center mt-2 gap-1">
      {banners.map((_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full ${
            i === bannerIndex
              ? 'w-4 bg-primary'
              : 'w-1.5 bg-white/30'
          }`}
        />
      ))}
    </View>
  </View>
)}

                  {/* ACTIVE ORDERS (Dynamic Island Style) */}
                  {activeOrders.length > 0 && (
                    <View className="mt-2 w-full px-0 pb-0 bg-transparent">
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ alignItems: 'flex-start' }}
                        decelerationRate="fast"
                        snapToInterval={width}
                        onMomentumScrollEnd={handleActiveOrderScroll}
                      >
                        {activeOrders.map((order) => (
                          <View key={order.id} style={{ width: width }}>
                            <ActiveOrderCard order={order} scrollY={scrollY} />
                          </View>
                        ))}
                      </ScrollView>

                      {/* Pagination Dots for Multiple Orders - SUBTLE & ACTIVE ONLY */}
                      {activeOrders.length > 1 && (
                        <View className="flex-row justify-center gap-1.5 absolute -bottom-2.5 left-0 right-0">
                          {activeOrders.map((_, i) => (
                            <View
                              key={i}
                              className={`rounded-full ${i === activeOrderIndex ? 'w-1.5 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-white/20'}`}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <View className="relative">
                  {/* CONTENT */}
                  <View>


                    {/* DEALS */}
                    {filteredDeals.length > 0 && (
                      <View className="mt-6">
                        <View className="px-6 flex-row items-center gap-2 mb-3">
                          <View className="bg-orange-500/20 p-1 rounded">
                            <Crown size={14} color="#f97316" />
                          </View>
                          <Text variant="h3">
                            {activeCategory === 'All'
                              ? 'Deals & Coupons'
                              : `${activeCategory} Deals`}
                          </Text>
                        </View>

                        <ScrollView
                          ref={dealsScrollRef}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                          scrollEventThrottle={16}
                          onScroll={handleDealsScroll}
                          onScrollBeginDrag={onDealsScrollBeginDrag}
                          onScrollEndDrag={onDealsScrollEndDrag}
                          onMomentumScrollEnd={onDealsMomentumScrollEnd}
                        >
                          {loopedDeals.map((item, idx) => (
                            <TouchableOpacity
                              key={`${item.id}-${idx}`}
                              className="w-[200px] bg-[#1A1A1A] rounded-xl overflow-hidden border border-white/5"
                              onPress={() => openItemDetails(item)}
                              activeOpacity={0.8}
                            >
                              <View className="absolute top-2 left-2 bg-red-600 px-2 py-1 rounded z-10">
                                <Text className="text-white text-[10px] font-bold">
                                  {item.discount}
                                </Text>
                              </View>
                              <Image
                                source={{ uri: item.image }}
                                className="w-full h-24"
                                resizeMode="cover"
                              />
                              <View className="p-3">
                                <Text
                                  className="text-white font-bold text-sm mb-1"
                                  numberOfLines={1}
                                >
                                  {item.name}
                                </Text>
                                <Text className="text-gray-400 text-[10px] mb-2">
                                  {item.outletName}
                                </Text>
                                <View className="flex-row items-center gap-2">
                                  <Text className="text-primary font-bold">₹{item.price}</Text>
                                  <Text className="text-gray-600 text-[10px] line-through">
                                    ₹{item.originalPrice}
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* POPULAR ITEMS */}
                    <View className="px-6 pb-6 pt-6">
                      <View className="flex-row justify-between items-center mb-4">
                        <Text variant="h3">
                          {activeCategory === 'All'
                            ? searchQuery
                              ? `Results`
                              : `At ${outlets.find((o) => o.id === activeOutletId)?.name || 'Outlet'}`
                            : `${activeCategory} Menu`}
                        </Text>
                      </View>

                      {showShimmer ?(<>

                       {[...Array(5)].map((_, i) => (
      <ShimmerCard key={i} />
    ))}
                      </>):filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => {
                          const isFav = favorites.includes(String(item.id));
                          const isDifferentOutlet = item.outletId !== activeOutletId;
                          const cartItem = cart.find((c) => c.id === item.id);
                          const inCart = !!cartItem;
                          const quantity = cartItem?.quantity || 0;
                          return (
                            <View key={item.id}>
                              <TouchableOpacity
                                onPress={() => openItemDetails(item)}
                                activeOpacity={0.8}
                                className="mb-4 bg-[#1A1A1A] p-3 rounded-[24px] border border-white/5 flex-row gap-4 relative"
                              >
                                {/* Favorites button - top right of card */}
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    hapticFeedback.medium();
                                    toggleFavorite(String(item.id));
                                  }}
                                  className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full items-center justify-center z-10"
                                >
                                  <Heart
                                    size={16}
                                    color={isFav ? '#ef4444' : '#fff'}
                                    fill={isFav ? '#ef4444' : 'transparent'}
                                  />
                                </TouchableOpacity>

                                <View>
                                  <Image
                                    source={{ uri: item.image }}
                                    className="w-28 h-28 rounded-2xl bg-gray-800"
                                  />
                                  {isDifferentOutlet && (
                                    <View className="absolute top-0 left-0 bg-primary px-2 py-1 rounded-tl-2xl rounded-br-lg z-10">
                                      <Text className="text-[8px] text-white font-bold">
                                        Others
                                      </Text>
                                    </View>
                                  )}
                                  {item.isReadyToPick && (
                                    <ReadyToPickRibbon isDifferentOutlet={isDifferentOutlet} />
                                  )}
                                </View>

                                <View className="flex-1 justify-between py-1">
                                  <View>
                                    <Text className="text-primary font-bold text-lg leading-tight mb-1">
                                      {item.name}
                                    </Text>
                                    <Text
                                      className="text-muted-foreground text-xs"
                                      numberOfLines={2}
                                    >
                                      {item.desc}
                                    </Text>
                                  </View>

                                  {/* Price, Rating and Cart Controls */}
                                  <View className="flex-row justify-between items-center">
                                    <View>
                                      <View className="flex-row items-center bg-black/30 px-2 py-1 rounded-full gap-1 border border-white/5 mb-1 self-start -ml-2">
                                        <Star size={10} color="#eab308" fill="#eab308" />
                                        <Text className="text-white text-[10px] font-bold">
                                          {item.rating}
                                        </Text>
                                      </View>
                                      <Text className="text-white font-bold text-xl">
                                        ₹{item.price}
                                      </Text>
                                    </View>

              {!inCart ? (
  <TouchableOpacity
    onPress={async (e) => {
      e.stopPropagation();
      hapticFeedback.selection();
      await addToCart(item, 1);
    }}
    className="bg-primary px-4 py-2 rounded-full"
  >
    <Text className="text-white text-xs font-bold">ADD</Text>
  </TouchableOpacity>
) : (
   <View
                            className="flex-row items-center gap-3 bg-black/40 rounded-full px-3 py-1.5 border"
                            style={{ borderColor: '#ea580c', borderWidth: 1.5 }}
                          >
    
    <TouchableOpacity
      onPress={(e) => {
        e.stopPropagation();
        hapticFeedback.light();
        updateQuantity(item.id, -1);
      }}
    >
      {quantity === 1 ? (
        <Minus size={16} color="#ef4444" />
      ) : (
        <Minus size={16} color="white" />
      )}
    </TouchableOpacity>

    <Text className="font-bold text-sm w-4 text-center text-white">
      {quantity}
    </Text>

    <TouchableOpacity
      onPress={(e) => {
        e.stopPropagation();
        hapticFeedback.light();
        updateQuantity(item.id, 1);
      }}
    >
      <Plus size={16} color="white" />
    </TouchableOpacity>
  </View>
)}
                                    
                                  </View>
                                </View>
                              </TouchableOpacity>
                            </View>
                          );
                        })
                      ) : (
                        <View className="py-10 items-center">
                          <Text className="text-gray-500 text-center">
                            No items found in this category.
                          </Text>
                          <Text className="text-gray-600 text-xs mt-2">
                            Try selecting another category or outlet.
                          </Text>
                        </View>



                        //      <Animated.View
                        //   entering={FadeInDown.duration(400)}
                        //   className="py-16 px-6"
                        // >
                        //   <View className="bg-[#111111] border border-white/5 rounded-3xl p-8 items-center shadow-2xl shadow-black">

                        //     {/* Illustration */}
                        //     <Image
                        //       source={{
                        //         uri: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png',
                        //       }}
                        //       style={{
                        //         width: 140,
                        //         height: 140,
                        //         marginBottom: 24,
                        //         opacity: 0.9,
                        //       }}
                        //       resizeMode="contain"
                        //     />

                        //     {/* Title */}
                        //     <Text className="text-white text-lg font-bold mb-2">
                        //       No dishes available
                        //     </Text>

                        //     {/* Subtitle */}
                        //     <Text className="text-gray-400 text-xs text-center leading-5 mb-6">
                        //       Looks like this outlet doesn’t have items in this category right now.
                        //     </Text>

                        //     {/* Action Button */}
                        //     <TouchableOpacity
                        //       onPress={() => {
                        //         setActiveCategory('All');
                        //         setActiveFilter(null);
                        //         setSearchQuery('');
                        //       }}
                        //       activeOpacity={0.8}
                        //       className="bg-primary px-6 py-3 rounded-full"
                        //     >
                        //       <Text className="text-white font-bold text-xs">
                        //         Browse All Items
                        //       </Text>
                        //     </TouchableOpacity>

                        //   </View>
                        // </Animated.View>

                      )}
                    </View>
                  </View>
                </View>
              </Animated.ScrollView>

              {/* ITEM DETAILS DRAWER */}
              <ItemDetailsDrawer
                item={selectedItem}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onAddToCart={(id, qty) => addToCart(selectedItem, qty)}
              />
            </SafeAreaView>
          </View>
        </Pressable>
      </Animated.View>



      {/* FLOATING CART BUTTON - Swiggy Style */}
  {cart.length > 0 && (
  <Animated.View
    entering={FadeIn.duration(200)}
  exiting={FadeOutDown.duration(150)}
    style={{
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: insets.bottom,
      backgroundColor: '#ea580c', // match your primary
      borderRadius: 24,
      shadowColor: '#ea580c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
      zIndex: 9999,
      overflow: 'hidden', // allow children to render fully
    }}
  >
    <TouchableOpacity
      onPress={() => {
        hapticFeedback.selection();
        router.push('/(tabs)/cart');
      }}
      activeOpacity={0.9}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
    >
      {/* Left: Shopping bag icon + quantity + label */}
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
            {cart.reduce((acc, item) => acc + item.quantity, 0)}{' '}
            {cart.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'item' : 'items'}
          </Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>Tap to view cart</Text>
        </View>
      </View>

      {/* Right: Total price + arrow */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
          ₹{cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(0)}
        </Text>
        <ChevronRight size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  </Animated.View>
)}

    </View>
  );
}


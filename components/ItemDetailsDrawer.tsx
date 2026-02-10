import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated as RNAnimated,
  StyleSheet,
  Pressable,
} from 'react-native';
import { X, Minus, Plus, Star, Clock, Flame } from 'lucide-react-native';
import { Text } from './ui/text';
import { hapticFeedback } from '../utils/haptics';
import { useStore } from '../context/StoreContext';

const { height } = Dimensions.get('window');

interface ItemDetailsDrawerProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  // FIXED: Changed 'id' from number to string to match backend UUIDs
  onAddToCart: (id: string, qty: number) => void;
}

export default function ItemDetailsDrawer({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: ItemDetailsDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  // Safe destructuring in case inventory is missing from context updates
  const store = useStore();
  const outlets = store.outlets || [];
  // inventory might be undefined in new StoreContext, handle gracefully
  const inventory = (store as any).inventory || {};

  // --- CONFIGURATION ---
  const FULL_HEIGHT_PERC = 0.85;
  const PARTIAL_HEIGHT_PERC = 0.45;

  const PARTIAL_OFFSET = height * (FULL_HEIGHT_PERC - PARTIAL_HEIGHT_PERC);

  // --- STATE & REFS ---
  const [drawerState, setDrawerState] = useState<'partial' | 'full'>('partial');
  const panY = useRef(new RNAnimated.Value(height)).current;
  const backdropOpacity = useRef(new RNAnimated.Value(0)).current;
  const scrollOffset = useRef(0);
  const isClosing = useRef(false);

  // --- PAN RESPONDER ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dy } = gestureState;
        if (drawerState === 'partial') return Math.abs(dy) > 5;
        if (drawerState === 'full') {
          return scrollOffset.current <= 0 && dy > 5;
        }
        return false;
      },
      onPanResponderGrant: () => {
        panY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        panY.flattenOffset();
        const { dy, vy } = gestureState;

        if (drawerState === 'partial') {
          if (dy < -50 || vy < -0.5) {
            snapTo('full');
          } else if (dy > 50 || vy > 0.5) {
            closeDrawer();
          } else {
            snapTo('partial');
          }
        } else {
          if (dy > 100 || vy > 0.5) {
            snapTo('partial');
          } else {
            snapTo('full');
          }
        }
      },
    })
  ).current;

  // --- ANIMATIONS ---
  const snapTo = (newState: 'partial' | 'full') => {
    const toValue = newState === 'full' ? 0 : PARTIAL_OFFSET;

    RNAnimated.spring(panY, {
      toValue,
      useNativeDriver: true,
      damping: 20,
      mass: 0.8,
      stiffness: 150,
    }).start(() => setDrawerState(newState));
  };

  const openDrawer = () => {
    isClosing.current = false;
    setDrawerState('partial');
    RNAnimated.parallel([
      RNAnimated.spring(panY, {
        toValue: PARTIAL_OFFSET,
        useNativeDriver: true,
        damping: 20,
        mass: 0.8,
      }),
      RNAnimated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    if (isClosing.current) return;
    isClosing.current = true;

    RNAnimated.parallel([
      RNAnimated.timing(panY, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }),
      RNAnimated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isOpen) {
        onClose();
        setDrawerState('partial');
      }
      isClosing.current = false;
    });
  };

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      panY.setValue(height);
      openDrawer();
    }
  }, [isOpen, item]);

  if (!item) return null;

  // Use item.isAvailable (from backend) or fallback to inventory check
  const isAvailable =
    item.isAvailable !== undefined
      ? item.isAvailable
      : inventory
        ? inventory[item.id] !== false
        : true;
  const outlet = outlets.find((o: any) => o.id === item.outletId);
  const isOutletOpen = outlet ? outlet.isOpen : true;
  const canOrder = isAvailable && isOutletOpen;

  const handleIncrement = () => {
    hapticFeedback.light();
    setQuantity((q) => q + 1);
  };

  const handleDecrement = () => {
    hapticFeedback.light();
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  const handleAdd = () => {
    if (!canOrder) return;
    hapticFeedback.success();
    closeDrawer();
    // Pass item.id (string) and quantity
    setTimeout(() => onAddToCart(item.id, quantity), 250);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={closeDrawer}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <RNAnimated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.7)', opacity: backdropOpacity },
          ]}
        >
          <TouchableOpacity style={{ flex: 1 }} onPress={closeDrawer} activeOpacity={1} />
        </RNAnimated.View>

        {/* Draggable Drawer Container */}
        <RNAnimated.View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            transform: [{ translateY: panY }],
          }}
        >
          {/* The Card Content */}
          <View
            style={{ height: height * FULL_HEIGHT_PERC }}
            className="bg-[#1A1A1A] rounded-t-[32px] overflow-hidden border-t border-white/10 shadow-2xl"
          >
            {/* --- DRAGGABLE HEADER ZONE --- */}
            <View {...panResponder.panHandlers} className="h-72 w-full relative bg-gray-900">
              <Pressable
                onPress={() => drawerState === 'partial' && snapTo('full')}
                style={StyleSheet.absoluteFill}
              >
                <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                <View className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#1A1A1A]" />
              </Pressable>

              <View className="absolute top-3 left-0 right-0 items-center z-20 pointer-events-none">
                <View className="w-12 h-1.5 bg-white/80 rounded-full shadow-sm mb-1" />
                {drawerState === 'partial' && (
                  <View className="bg-black/30 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] text-white font-bold">Pull up for details</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={closeDrawer}
                className="absolute top-6 right-6 w-9 h-9 bg-black/40 rounded-full items-center justify-center border border-white/10 z-30"
              >
                <X size={18} color="white" />
              </TouchableOpacity>
            </View>

            {/* --- SCROLLABLE CONTENT ZONE --- */}
            <ScrollView
              className="px-6 pt-2"
              contentContainerStyle={{ paddingBottom: 140 }}
              scrollEnabled={drawerState === 'full'}
              onScroll={(e) => {
                scrollOffset.current = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-4">
                  <Text className="text-3xl font-black text-white mb-1 font-heading">
                    {item.name}
                  </Text>
                  <Text className="text-gray-400 text-sm mb-4 leading-5">
                    {item.desc || item.description || 'Delicious meal prepared fresh.'}
                  </Text>
                </View>
                <Text className="text-2xl font-black text-primary">₹{item.price}</Text>
              </View>

              <View className="flex-row gap-3 mb-6">
                <View className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <Star size={14} color="#eab308" fill="#eab308" />
                  <Text className="text-white text-xs font-bold ml-1.5">
                    {item.rating || '4.5'}
                  </Text>
                </View>
                <View className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <Clock size={14} color={item.isReadyToPick ? "#10b981" : "#f97316"} />
                  <Text className={`text-xs font-bold ml-1.5 ${item.isReadyToPick ? "text-emerald-500" : "text-white"}`}>
                    {item.isReadyToPick ? "Ready to Pick" : `${item.prepTime || 15} min`}
                  </Text>
                </View>
                <View className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <Flame size={14} color="#ef4444" />
                  <Text className="text-white text-xs font-bold ml-1.5">Popular</Text>
                </View>
              </View>

              {!canOrder && (
                <View className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
                  <Text className="text-red-400 font-bold text-center">
                    {!isOutletOpen ? 'Outlet is Closed' : 'Currently Sold Out'}
                  </Text>
                </View>
              )}

              <View className="space-y-4 mb-6">
                <Text className="text-white font-bold text-lg">Details</Text>
                <Text className="text-gray-400 text-sm leading-6">
                  Made with premium ingredients and authentic spices. Served hot with customized
                  dips and sides. Allergens information available upon request.
                </Text>
              </View>
            </ScrollView>

            {/* --- BOTTOM ACTION BAR --- */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#1A1A1A] border-t border-white/5 pb-8 z-40">
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center bg-white/5 rounded-2xl border border-white/10 h-14 px-4">
                  <TouchableOpacity onPress={handleDecrement} disabled={!canOrder} className="p-2">
                    <Minus size={20} color={canOrder ? 'white' : 'gray'} />
                  </TouchableOpacity>
                  <Text className="text-white font-bold text-lg w-10 text-center">{quantity}</Text>
                  <TouchableOpacity onPress={handleIncrement} disabled={!canOrder} className="p-2">
                    <Plus size={20} color={canOrder ? 'white' : 'gray'} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleAdd}
                  disabled={!canOrder}
                  activeOpacity={0.8}
                  className={`flex-1 h-14 rounded-2xl items-center justify-center shadow-lg ${canOrder ? 'bg-primary' : 'bg-gray-700'}`}
                >
                  <Text className="text-white font-bold text-lg">
                    Add Item - ₹{item.price * quantity}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

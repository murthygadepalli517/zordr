import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { useStore, Order } from '../../context/StoreContext';
import {
  CheckCircle2,
  XCircle,
  ChefHat,
  ShoppingBag,
  ArrowRight,
  Receipt,
  RefreshCw,
  AlertTriangle,
  Bike,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  Layout as ReanimatedLayout,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { hapticFeedback } from '../../utils/haptics';
import { PrepTimeProgressBar } from '../../components/PrepTimeProgressBar';

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, cancelOrder, addToCart, clearCart } = useStore();
  const [activeTab, setActiveTab] = useState<'active' | 'reorder' | 'past'>('active');

  // State for Custom Cancel Modal
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  // FIXED: Added 'out_for_delivery' to active and 'delivered' to past
  const activeOrders = orders.filter((o) =>
    ['new', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
  );

  const pastOrders = orders.filter((o) =>
    ['delivered', 'completed', 'cancelled','expired'].includes(o.status)
  );

  // TODO: Backend needs to implement frequently ordered items endpoint
  // For now, reorder tab shows same as past orders
  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const handleTabChange = (tab: 'active' | 'reorder' | 'past') => {
    hapticFeedback.selection();
    setActiveTab(tab);
  };

  const initiateCancel = (orderId: string) => {
    hapticFeedback.warning();
    setOrderToCancel(orderId);
  };

  const confirmCancel = () => {
    if (orderToCancel) {
      hapticFeedback.error();
      cancelOrder(orderToCancel);
      setOrderToCancel(null);
    }
  };

  const handleReorder = (order: Order) => {
    hapticFeedback.medium();
    clearCart();
    order.items.forEach((item) => {
      // Ensure we map the properties correctly for the cart
      addToCart(
        {
          ...item,
          outletId: order.outletId, // Important: use the order's outlet
          outletName: order.outletName || (order as any).outlet, // Fallback if name differs
        },
        item.quantity
      );
    });
    router.push('/cart');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
      case 'pending':
      case 'confirmed':
        return 'text-blue-400';
      case 'preparing':
        return 'text-orange-500';
      case 'ready':
        return 'text-green-500';
      case 'out_for_delivery':
        return 'text-purple-500';
      case 'delivered':
      case 'completed':
        return 'text-gray-400';
      case 'cancelled':
        return 'text-red-500';
      case 'expired':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preparing':
        return <ChefHat size={16} color="#f97316" />;
      case 'ready':
        return <ShoppingBag size={16} color="#22c55e" />;
      case 'out_for_delivery':
        return <Bike size={16} color="#a855f7" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle2 size={16} color="#9ca3af" />;
      case 'cancelled':
        return <XCircle size={16} color="#ef4444" />;
      case 'new':
      case 'pending':
      case 'confirmed':
        return <CheckCircle2 size={16} color="#60a5fa" />;
      default:
        return <CheckCircle2 size={16} color="#6b7280" />;
    }
  };

  return (
    <Layout className="flex-1 bg-black" safeArea>
      <View className="px-6 pt-2 pb-4">
        <Text className="text-2xl font-black text-white mb-6">My Orders</Text>

        {/* Segmented Control */}
        <View className="flex-row bg-[#1A1A1A] p-1 rounded-full border border-white/10">
          <TouchableOpacity
            onPress={() => handleTabChange('active')}
            className={`flex-1 py-4 rounded-full items-center ${activeTab === 'active' ? 'bg-[#FF5500]' : 'bg-transparent'}`}
          >
            <Text
              className={`font-bold text-base ${activeTab === 'active' ? 'text-white' : 'text-gray-500'}`}
            >
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange('reorder')}
            className={`flex-1 py-4 rounded-full items-center ${activeTab === 'reorder' ? 'bg-[#FF5500]' : 'bg-transparent'}`}
          >
            <Text
              className={`font-bold text-base ${activeTab === 'reorder' ? 'text-white' : 'text-gray-500'}`}
            >
              Reorder
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange('past')}
            className={`flex-1 py-4 rounded-full items-center ${activeTab === 'past' ? 'bg-[#FF5500]' : 'bg-transparent'}`}
          >
            <Text
              className={`font-bold text-base ${activeTab === 'past' ? 'text-white' : 'text-gray-500'}`}
            >
              Past Orders
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {displayOrders.length > 0 ? (
          displayOrders.map((order, index) => (
            <Animated.View
              key={order.id}
              entering={FadeInDown.delay(index * 100).springify()}
              layout={ReanimatedLayout.springify()}
              className="mb-4"
            >
              <View
                className={`bg-[#1A1A1A] border border-white/5 p-5 rounded-[24px] overflow-hidden ${order.status === 'cancelled' ? 'opacity-60' : ''}`}
              >
                {activeTab === 'active' && (
                  <View className="absolute top-0 right-0 p-3 bg-[#FF5500]/10 rounded-bl-2xl border-l border-b border-[#FF5500]/20">
                    <Text className="text-[#FF5500] text-[10px] font-bold animate-pulse">
                      LIVE UPDATE
                    </Text>
                  </View>
                )}

                <View className="flex-row justify-between items-start mb-4">
                  <View>
                    {/* Handle both 'outlet' and 'outletName' depending on what backend sends */}
                    <Text className="text-white font-bold text-lg mb-1">
                      {order.outletName || (order as any).outlet || 'Outlet'}
                    </Text>
                    <Text className="text-gray-500 text-xs font-medium">
                      #{order.id.split('-').pop()} •{' '}
                      {new Date(order.createdAt || (order as any).date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>

                <View className="bg-black/30 p-3 rounded-xl mb-4 border border-white/5">
                  {order.items.map((item, idx) => (
                    <View key={idx} className="flex-row items-start gap-2 mb-1">
                      <Text className="text-gray-400 text-xs mt-0.5">•</Text>
                      <Text className="text-gray-300 text-sm font-medium flex-1">
                        {item.quantity}x {item.name}
                      </Text>
                    </View>
                  ))}
                </View>

                {order.instructions && (
                  <View className="bg-[#FF5500]/5 p-3 rounded-xl mb-4 border border-[#FF5500]/10">
                    <Text className="text-[#FF5500] text-[10px] font-bold uppercase mb-1">
                      Kitchen Note
                    </Text>
                    <Text className="text-gray-300 text-xs italic">"{order.instructions}"</Text>
                  </View>
                )}

                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center gap-2">
                    {getStatusIcon(order.status)}
                    <Text className={`text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <Text className="text-white font-black text-lg">₹{order.total}</Text>
                </View>

                {/* Dynamic Prep Time Progress Bar */}
                {['confirmed', 'preparing', 'ready'].includes(order.status) && order.pickupTime && (
                  <View className="mb-4">
                    <PrepTimeProgressBar
                      startTime={order.updatedAt || order.createdAt} // Use updatedAt (acceptance time)
                      endTime={order.pickupTime} // Ensure backend sends this now
                      status={order.status}
                    />
                  </View>
                )}

                {/* Action Buttons */}
                {activeTab === 'active' && (
                  <View className="flex-row gap-3 pt-2">
                    {/* Only allow cancel if pending/confirmed/preparing */}
                    {['pending', 'confirmed', 'preparing'].includes(order.status) && (
                      <TouchableOpacity
                        onPress={() => initiateCancel(order.id)}
                        className="flex-1 py-3 rounded-xl border border-red-500/20 flex-row items-center justify-center gap-2 bg-red-500/5"
                      >
                        <XCircle size={16} color="#ef4444" />
                        <Text className="text-red-500 font-bold text-xs">Cancel</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/order-confirmation',
                          params: { orderId: order.id },
                        })
                      }
                      className="flex-[2] py-3 rounded-xl bg-[#FF5500] flex-row items-center justify-center gap-2"
                    >
                      <Text className="text-white font-bold text-xs">Track Status</Text>
                      <ArrowRight size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* {(activeTab === 'reorder' || activeTab === 'past') &&
                  order.status !== 'cancelled' && ( */}
                  {(activeTab === 'reorder' || activeTab === 'past') &&
                  !['cancelled', 'expired'].includes(order.status) && (
                    <TouchableOpacity
                      onPress={() => handleReorder(order)}
                      className="mt-2 py-3 rounded-xl bg-[#FF5500] flex-row items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} color="white" />
                      <Text className="text-white font-bold text-sm">Reorder</Text>
                    </TouchableOpacity>
                  )}
              </View>
            </Animated.View>
          ))
        ) : (
          <View className="items-center justify-center py-20 opacity-50">
            <Receipt size={48} color="white" />
            <Text className="text-white font-bold mt-4">No {activeTab} orders</Text>
          </View>
        )}
      </ScrollView>

      {/* CUSTOM DARK THEMED MODAL FOR CANCELLATION */}
      <Modal transparent visible={!!orderToCancel} animationType="none" statusBarTranslucent>
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          {!!orderToCancel && (
            <Animated.View
              entering={ZoomIn.duration(200)}
              exiting={ZoomOut.duration(200)}
              className="w-full bg-[#1A1A1A] rounded-[32px] p-6 border border-white/10 items-center"
            >
              <View className="w-14 h-14 bg-red-500/10 rounded-full items-center justify-center mb-4">
                <AlertTriangle size={28} color="#EF4444" />
              </View>
              <Text className="text-white font-black text-xl mb-2">Cancel Order?</Text>
              <Text className="text-gray-400 text-center mb-8 px-4">
                Are you sure you want to cancel this order? This action cannot be undone.
              </Text>

              <View className="flex-row gap-4 w-full">
                <TouchableOpacity
                  onPress={() => setOrderToCancel(null)}
                  className="flex-1 py-4 rounded-2xl bg-white/5 items-center"
                >
                  <Text className="text-white font-bold">No, Keep it</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmCancel}
                  className="flex-1 py-4 rounded-2xl bg-red-500 items-center"
                >
                  <Text className="text-white font-bold">Yes, Cancel</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>
      </Modal>
    </Layout>
  );
}

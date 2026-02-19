import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
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
  Star,
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
const [ratings, setRatings] = useState<{
  [orderId: string]: {
    rating: number;
    review: string;
    submitted: boolean;
  };
}>({});



  // State for Custom Cancel Modal
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
const { authToken } = useStore(); // Get the stored token dynamically

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

  useEffect(() => {
  if (!authToken) return;

  const loadReviews = async () => {
    const newRatings: typeof ratings = {};
    for (const order of pastOrders) {
      const review = await fetchReview(order.id, authToken);
      if (review) {
        newRatings[order.id] = {
          rating: review.rating,
          review: review.comment,
          submitted: true,
        };
      }
    }
    setRatings((prev) => ({ ...prev, ...newRatings }));
  };

  loadReviews();
}, [authToken, pastOrders]);

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
        return 'text-green-500';
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
        return <CheckCircle2 size={16} color="#04c42ec7" />;
      case 'cancelled':
        return <XCircle size={16} color="#ef4444" />;
        case 'expired':
        return <XCircle size={16} color="#ef4444" />;
      case 'new':
      case 'pending':
      case 'confirmed':
        return <CheckCircle2 size={16} color="#60a5fa" />;
      default:
        return <CheckCircle2 size={16} color="#6b7280" />;
    }
  };


//   const fetchReview = async (orderId: string, token: string) => {
//   try {
//     const res = await fetch(`https://zordr-backend.onrender.com/api/reviews/${orderId}`, {
//       method: 'GET',
//       headers: { 
//         Authorization: `Bearer ${token}`,
//         Accept: 'application/json',
//       },
//     });
//     const data = await res.json();
//     if (data.success && data.hasReviewed) return data.data;
//     return null;
//   } catch (error) {
//     console.error('Error fetching review:', error);
//     return null;
//   }
// };

// const postReview = async (orderId: string, rating: number, comment: string, token: string) => {
//   try {
//     const res = await fetch(`https://zordr-backend.onrender.com/api/reviews/${orderId}`, {
//       method: 'POST',
//       headers: { 
//         Authorization: `Bearer ${token}`,
//         Accept: 'application/json',
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ rating, comment }),
//     });
//     const data = await res.json();
//     return data.success;
//   } catch (error) {
//     console.error('Error posting review:', error);
//     return false;
//   }
// };


const fetchReview = async (orderId: string, token: string) => {
  console.log('--- fetchReview START ---');
  console.log('Order ID:', orderId);
  console.log('Token:', token);

  try {
    const url = `https://zordr-backend.onrender.com/api/reviews/${orderId}`;
    console.log('Fetching URL:', url);

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    console.log('Request Headers:', headers);

    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('Response Status:', res.status);
    console.log('Response OK?', res.ok);

    const data = await res.json();
    console.log('Response JSON:', data);

    if (data.success && data.hasReviewed) {
      console.log('Review found:', data.data);
      return data.data; // Should be { rating, comment }
    }

    console.log('No review found for this order.');
    return null;
  } catch (error) {
    console.error('Error fetching review:', error);
    return null;
  } finally {
    console.log('--- fetchReview END ---');
  }
};

const postReview = async (orderId: string, rating: number, comment: string, token: string) => {
  console.log('--- postReview START ---');
  console.log('Order ID:', orderId);
  console.log('Rating:', rating);
  console.log('Comment:', comment);
  console.log('Token:', token);

  try {
    const url = `https://zordr-backend.onrender.com/api/reviews/${orderId}`;
    console.log('Posting URL:', url);

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    console.log('Request Headers:', headers);

    const body = JSON.stringify({ rating, comment });
    console.log('Request Body:', body);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    console.log('Response Status:', res.status);
    console.log('Response OK?', res.ok);

    const data = await res.json();
    console.log('Response JSON:', data);

    if (data.success) {
      console.log('Review submitted successfully!');
      return true;
    }

    console.warn('Failed to submit review:', data);
    return false;
  } catch (error) {
    console.error('Error posting review:', error);
    return false;
  } finally {
    console.log('--- postReview END ---');
  }
};


const renderRatingSection = (order: Order) => {
  const ratingData = ratings[order.id] || {
    rating: 0,
    review: '',
    submitted: false,
  };

  if (ratingData.submitted) {
    // SHOW fetched review dynamically instead of just a thank-you
    return (
      <View className="mt-3 bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
        <Text className="text-green-400 font-bold text-sm mb-2">
          Your Review ⭐
        </Text>

        {/* ⭐ Star Row */}
       <View className="flex-row mb-3 items-center">
  {[1, 2, 3, 4, 5].map((index) => {
    let fill = "#444";       // default empty
    let filled = false;

    if (ratingData.rating >= index) fill = "#FACC15"; // full star
    else if (ratingData.rating >= index - 0.5) fill = "#FACC15"; // half star visual

    return (
      <View key={index} className="relative mr-2">
        {/* Empty Star */}
        <Star size={28} color="#444" />
        {/* Full / Half Star */}
        {ratingData.rating >= index ? (
          <Star size={28} color="#FACC15" fill="#FACC15" style={{ position: 'absolute', left: 0 }} />
        ) : ratingData.rating >= index - 0.5 ? (
          <View style={{ position: 'absolute', overflow: 'hidden', width: 14, left: 0 }}>
            <Star size={28} color="#FACC15" fill="#FACC15" />
          </View>
        ) : null}
        {/* Touchable for selecting */}
        <View style={{ position: 'absolute', flexDirection: 'row' }}>
          <TouchableOpacity style={{ width: 14, height: 28 }} onPress={() => setRating(index - 0.5)} />
          <TouchableOpacity style={{ width: 14, height: 28 }} onPress={() => setRating(index)} />
        </View>
      </View>
    );
  })}
  <Text className="#FACC15 ml-3 font-bold text-base">{ratingData.rating.toFixed(1)}</Text>
</View>


        {/* Review Text */}
        {ratingData.review ? (
          <Text className="text-gray-300 text-sm italic">{`"${ratingData.review}"`}</Text>
        ) : (
          <Text className="text-gray-400 text-sm italic">No comment provided</Text>
        )}
      </View>
    );
  }

  // If not submitted, show the interactive rating input (existing UI)
  const setRating = (value: number) => {
    setRatings((prev) => ({
      ...prev,
      [order.id]: {
        ...ratingData,
        rating: value,
      },
    }));
  };

  return (
    <View className="mt-3 bg-[#111] border border-white/10 p-4 rounded-xl">
      <Text className="text-white font-bold text-sm mb-3">
        Rate & Review
      </Text>

      {/* ⭐ Star Row */}
      <View className="flex-row mb-3 items-center">
        {[1, 2, 3, 4, 5].map((index) => {
          const full = ratingData.rating >= index;
          const half = ratingData.rating >= index - 0.5 && ratingData.rating < index;

          return (
            <View key={index} className="relative mr-2">
              <Star size={28} color="#444" />
              {full && (
                <Star size={28} color="#FACC15" fill="#FACC15" style={{ position: 'absolute', left: 0 }} />
              )}
              {half && (
                <View style={{ position: 'absolute', width: 14, overflow: 'hidden' }}>
                  <Star size={28} color="#FACC15" fill="#FACC15" />
                </View>
              )}
              <View style={{ position: 'absolute', flexDirection: 'row' }}>
                <TouchableOpacity style={{ width: 14, height: 28 }} onPress={() => setRating(index - 0.5)} />
                <TouchableOpacity style={{ width: 14, height: 28 }} onPress={() => setRating(index)} />
              </View>
            </View>
          );
        })}
        <Text className="#FACC15 ml-3 font-bold text-base">{ratingData.rating.toFixed(1)}</Text>
      </View>

      {/* Review Input */}
      <TextInput
        value={ratingData.review}
        onChangeText={(text) =>
          setRatings((prev) => ({
            ...prev,
            [order.id]: { ...ratingData, review: text },
          }))
        }
        placeholder="Write your review..."
        placeholderTextColor="#666"
        multiline
        className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm mb-3"
      />

      {/* Submit Button */}
      <TouchableOpacity
        disabled={!ratingData.rating}
        onPress={async () => {
          if (!order.id || !authToken) return;
          const success = await postReview(order.id, ratingData.rating, ratingData.review, authToken);
          if (success) {
            setRatings((prev) => ({ ...prev, [order.id]: { ...ratingData, submitted: true } }));
            hapticFeedback.success();
          } else {
            hapticFeedback.error();
            alert('Failed to submit review. Please try again.');
          }
        }}
        className={`py-3 rounded-xl items-center ${ratingData.rating ? 'bg-[#FF5500]' : 'bg-gray-700'}`}
      >
        <Text className="text-white font-bold text-sm">Submit Review</Text>
      </TouchableOpacity>
    </View>
  );
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

                  {activeTab === 'past' && order.status === 'completed' && (
            renderRatingSection(order)
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

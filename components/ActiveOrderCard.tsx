import React from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from './ui/text';
import { ChevronRight, Clock, ChefHat } from 'lucide-react-native';
import { usePrepTime } from './PrepTimeProgressBar';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    SharedValue,
    useDerivedValue,
    withSpring
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Order } from '../context/StoreContext';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ActiveOrderCardProps {
    order: Order;
    scrollY: SharedValue<number>;
}

export const ActiveOrderCard = ({ order, scrollY }: ActiveOrderCardProps) => {
    const router = useRouter();
    const { timeLeftStr, progress } = usePrepTime(
        order.updatedAt || order.createdAt || new Date().toISOString(),
        order.pickupTime || '',
        order.status
    );

    const animatedBarStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }));

    // Glow Color based on status
    const glowColor = order.status === 'ready' ? '#22c55e' : '#f97316';

    // Animation Logic
    const isCollapsed = useDerivedValue(() => {
        return scrollY.value > 50 ? 1 : 0;
    });

    const containerStyle = useAnimatedStyle(() => {
        const height = interpolate(scrollY.value, [0, 80], [90, 44], Extrapolation.CLAMP);
        const marginHorizontal = interpolate(scrollY.value, [0, 80], [16, 12], Extrapolation.CLAMP);

        return {
            height,
            marginHorizontal,
        };
    });

    const expandedOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, 40], [1, 0], Extrapolation.CLAMP),
        transform: [{ scale: interpolate(scrollY.value, [0, 40], [1, 0.9], Extrapolation.CLAMP) }]
    }));

    const collapsedOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [30, 80], [0, 1], Extrapolation.CLAMP),
        transform: [{ translateY: interpolate(scrollY.value, [30, 80], [10, 0], Extrapolation.CLAMP) }]
    }));

    return (
        <Animated.View
            style={[
                containerStyle,
                {
                    shadowColor: glowColor,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                    marginBottom: 0,
                    zIndex: 100
                }
            ]}
        >
            <TouchableOpacity
                onPress={() =>
                    router.push({
                        pathname: '/order-confirmation',
                        params: { orderId: order.id },
                    })
                }
                activeOpacity={0.9}
                style={{ flex: 1 }}
            >
                <LinearGradient
                    colors={[glowColor, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, padding: 1, borderRadius: 12 }}
                >
                    <View className="flex-1 bg-[#121212] rounded-[11px] overflow-hidden relative justify-center">

                        {/* EXPANDED CONTENT - ULTRA COMPACT - WITH ITEMS */}
                        <Animated.View style={[expandedOpacity, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'space-between' }]}>
                            {/* Dynamic Bottom Progress Bar */}
                            {order.pickupTime && ['confirmed', 'preparing'].includes(order.status) && (
                                <View className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                                    <Animated.View className="h-full bg-primary" style={animatedBarStyle} />
                                </View>
                            )}

                            {/* Top Row: Details */}
                            <View>
                                <View className="flex-row justify-between items-center mb-0.5">
                                    <View className="flex-row items-center gap-2">
                                        <View className={`w-2.5 h-2.5 rounded-full ${order.status === 'ready' ? 'bg-green-500' : 'bg-primary'} animate-pulse`} />
                                        <Text className={`text-xs font-black uppercase tracking-wider ${order.status === 'ready' ? 'text-green-500' : 'text-primary'}`}>
                                            {order.status}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                                        <Clock size={12} color={glowColor} />
                                        <Text className="text-gray-300 text-xs font-bold">
                                            {timeLeftStr}
                                        </Text>
                                    </View>
                                </View>

                                <Text className="text-white font-bold text-lg leading-tight mt-0.5" numberOfLines={1}>
                                    {order.outletName}
                                </Text>
                                <Text className="text-gray-400 text-sm font-medium mt-0.5" numberOfLines={1}>
                                    {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                                </Text>
                            </View>
                        </Animated.View>

                        {/* COLLAPSED CONTENT (The Mini Pill) - LARGER FONTS */}
                        <Animated.View style={[collapsedOpacity, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: '100%' }]}>
                            <View className="flex-row items-center gap-2.5">
                                <View className={`w-6 h-6 rounded-full items-center justify-center ${order.status === 'ready' ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                                    {order.status === 'ready' ? <ChefHat size={14} color="#22c55e" /> : <ChefHat size={14} color="#f97316" />}
                                </View>
                                <Text className="text-white font-bold text-sm">
                                    {order.status === 'ready' ? 'Order Ready' : 'Preparing...'}
                                </Text>
                            </View>

                            {/* Time Pill on Right */}
                            <View className="bg-white/5 px-2.5 py-1 rounded-md">
                                <Text className="text-xs font-bold text-white">
                                    {timeLeftStr}
                                </Text>
                            </View>

                            {/* Mini Progress Bar Bottom */}
                            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                                <Animated.View className="h-full bg-primary" style={animatedBarStyle} />
                            </View>
                        </Animated.View>

                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

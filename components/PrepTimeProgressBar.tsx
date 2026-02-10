import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { ChefHat, Timer } from 'lucide-react-native';

interface PrepTimeProgressBarProps {
    startTime: string; // ISO String (createdAt)
    endTime: string;   // ISO String (pickupTime/targetTime)
    status: string;
}

export const usePrepTime = (startTime: string, endTime: string, status: string) => {
    const [timeLeftStr, setTimeLeftStr] = useState('');
    const progress = useSharedValue(0);

    useEffect(() => {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();

        if (isNaN(start) || isNaN(end) || end - start <= 0) {
            progress.value = 0;
            return;
        }
        const totalDuration = end - start;

        const updateProgress = () => {
            const now = Date.now();
            const elapsed = now - start;
            const rawProgress = Math.min(Math.max(elapsed / totalDuration, 0), 1);
            progress.value = withTiming(rawProgress * 100, { duration: 1000, easing: Easing.linear });

            const remainingMs = Math.max(end - now, 0);
            const remainingMins = Math.ceil(remainingMs / 60000);

            if (status === 'ready') {
                setTimeLeftStr('Ready to Pickup!');
                progress.value = withTiming(100);
            } else if (remainingMins <= 0) {
                setTimeLeftStr('Almost Ready...');
            } else {
                setTimeLeftStr(`${remainingMins} mins left`);
            }
        };

        updateProgress();
        const interval = setInterval(updateProgress, 1000);
        return () => clearInterval(interval);
    }, [startTime, endTime, status]);

    return { timeLeftStr, progress };
};

export const PrepTimeProgressBar: React.FC<PrepTimeProgressBarProps> = ({
    startTime,
    endTime,
    status,
}) => {
    const { timeLeftStr, progress } = usePrepTime(startTime, endTime, status);

    // Pulse animation for the "Preparing" indicator
    const pulseOpacity = useSharedValue(1);

    useEffect(() => {
        if (status === 'preparing') {
            pulseOpacity.value = withRepeat(
                withSequence(withTiming(0.6, { duration: 800 }), withTiming(1, { duration: 800 })),
                -1,
                true
            );
        }
    }, [status]);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        opacity: pulseOpacity.value,
    }));

    if (['cancelled', 'delivered', 'completed', 'new'].includes(status)) return null;

    return (
        <View className="mt-4">
            <View className="flex-row justify-between items-end mb-2">
                <View className="flex-row items-center gap-1.5">
                    {status === 'preparing' ? (
                        <Animated.View style={pulseStyle} className="bg-orange-500/10 p-1 rounded-md">
                            <ChefHat size={14} color="#f97316" />
                        </Animated.View>
                    ) : (
                        <Timer size={14} color="#22c55e" />
                    )}
                    <Text className="text-gray-400 text-xs font-medium">
                        {status === 'preparing' ? 'Preparing...' : 'Status'}
                    </Text>
                </View>
                <Text className="text-white text-xs font-bold font-display">{timeLeftStr}</Text>
            </View>

            <View className="h-1.5 bg-white/10 rounded-full overflow-hidden w-full">
                <Animated.View className="h-full bg-orange-500 rounded-full" style={animatedStyle} />
            </View>
        </View>
    );
};

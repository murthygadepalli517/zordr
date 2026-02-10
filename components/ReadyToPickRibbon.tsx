import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    FadeInLeft,
    ZoomIn,
    Easing,
} from 'react-native-reanimated';
import { Clock } from 'lucide-react-native';
import { Text } from './ui/text';

interface ReadyToPickRibbonProps {
    isDifferentOutlet: boolean;
}

export const ReadyToPickRibbon: React.FC<ReadyToPickRibbonProps> = ({ isDifferentOutlet }) => {
    // Continuous breathing animation for the "dynamic" feel
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        // A subtle breathe effect to catch the eye without being annoying
        scale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1, // Infinite loop
            true // Reverse
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // Style logic for positioning
    const positionClass = isDifferentOutlet ? 'top-5' : 'top-0 rounded-tl-2xl';

    return (
        <Animated.View
            entering={FadeInLeft.springify().damping(15).stiffness(200).delay(200)}
            style={[animatedStyle]}
            className={`absolute left-0 bg-emerald-500 px-2 py-1 rounded-br-lg z-20 ${positionClass} shadow-sm`}
        >
            <View className="flex-row items-center gap-1">
                <Clock size={8} color="white" />
                <Text className="text-[8px] text-white font-bold ml-0.5 tracking-wider">
                    READY
                </Text>
            </View>
        </Animated.View>
    );
};

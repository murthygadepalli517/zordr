import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withRepeat,
    interpolate,
    Extrapolate,
    runOnJS,
} from 'react-native-reanimated';
import { Gift, Utensils, Coffee, Pizza, Lock, Check } from 'lucide-react-native';
import { Text } from './ui/text';
import { hapticFeedback } from '../utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2; // 2 columns with padding
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface Reward {
    title: string;
    description: string;
    type: 'discount' | 'free_item' | 'coins';
}

interface MysteryCouponProps {
    id: string;
    cost: number;
    reward: Reward;
    isUnlocked: boolean;
    canUnlock: boolean;
    onUnlock: () => void;
}

export const MysteryCoupon: React.FC<MysteryCouponProps> = ({
    id,
    cost,
    reward,
    isUnlocked,
    canUnlock,
    onUnlock,
}) => {
    // Animation Values
    const flipProgress = useSharedValue(isUnlocked ? 1 : 0);
    const scale = useSharedValue(1);
    const shake = useSharedValue(0);
    const glowOpacity = useSharedValue(0);

    useEffect(() => {
        if (isUnlocked) {
            flipProgress.value = withSpring(1, { damping: 12 });
            glowOpacity.value = withRepeat(
                withSequence(withTiming(0.6, { duration: 1000 }), withTiming(0.2, { duration: 1000 })),
                -1,
                true
            );
        }
    }, [isUnlocked]);

    const handlePress = () => {
        if (isUnlocked) return;

        if (canUnlock) {
            hapticFeedback.heavy();

            // Unlock sequence
            scale.value = withSequence(
                withTiming(0.95, { duration: 100 }),
                withTiming(1.05, { duration: 100 }),
                withSpring(1, { damping: 10 })
            );

            // Trigger unlock logic after animation start
            setTimeout(() => {
                runOnJS(onUnlock)();
            }, 200);

        } else {
            hapticFeedback.error();
            // Shake animation for insufficient funds
            shake.value = withSequence(
                withTiming(-5, { duration: 50 }),
                withTiming(5, { duration: 50 }),
                withTiming(-5, { duration: 50 }),
                withTiming(5, { duration: 50 }),
                withTiming(0, { duration: 50 })
            );
        }
    };

    // Styles
    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateY}deg` },
                { scale: scale.value },
                { translateX: shake.value },
            ],
            backfaceVisibility: 'hidden',
            zIndex: isUnlocked ? 0 : 1,
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateY}deg` },
                { scale: scale.value },
            ],
            backfaceVisibility: 'hidden',
            zIndex: isUnlocked ? 1 : 0,
        };
    });

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const FrontCard = () => (
        <View style={[styles.card, styles.frontCard]}>
            {/* Foodie Pattern Background */}
            <View style={styles.patternContainer}>
                <Utensils size={40} color="rgba(255,255,255,0.03)" style={[styles.patternIcon, { top: 10, left: 10 }]} />
                <Coffee size={40} color="rgba(255,255,255,0.03)" style={[styles.patternIcon, { top: 10, right: 10 }]} />
                <Pizza size={40} color="rgba(255,255,255,0.03)" style={[styles.patternIcon, { bottom: 10, left: 10, transform: [{ rotate: '45deg' }] }]} />
                <Gift size={40} color="rgba(255,255,255,0.03)" style={[styles.patternIcon, { bottom: 10, right: 10 }]} />
                <View style={[styles.patternDot, { top: '50%', left: '50%' }]} />
            </View>

            {/* Ribbon/Design */}
            <View style={styles.ribbonVertical} />
            <View style={styles.ribbonHorizontal} />

            {/* Center Badge */}
            <View style={styles.centerBadge}>
                <View style={styles.centerBadgeInner}>
                    <Text style={styles.zordrText}>ZORDR</Text>
                    <Text style={styles.mysteryText}>MYSTERY</Text>
                </View>
            </View>

            {/* Cost Tag */}
            <View style={styles.costTag}>
                {canUnlock ? (
                    <Lock size={12} color="#1A1A1A" />
                ) : (
                    <Lock size={12} color="#666" />
                )}
                <Text style={[styles.costText, !canUnlock && styles.costTextDisabled]}>
                    {cost} Z
                </Text>
            </View>
        </View>
    );

    const BackCard = () => (
        <View style={[styles.card, styles.backCard]}>
            {/* Glow Effect */}
            <Animated.View style={[styles.glow, glowStyle]} />

            <View style={styles.rewardContent}>
                <View style={styles.iconContainer}>
                    {reward.type === 'discount' && <Gift size={32} color="#FF5500" />}
                    {reward.type === 'free_item' && <Pizza size={32} color="#FF5500" />}
                    {reward.type === 'coins' && <Utensils size={32} color="#FF5500" />}
                </View>

                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardDesc}>{reward.description}</Text>

                <View style={styles.redeemedBadge}>
                    <Check size={12} color="#FFF" />
                    <Text style={styles.redeemedText}>REDEEM NOW</Text>
                </View>
            </View>
        </View>
    );

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={handlePress}
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        >
            <View style={styles.container}>
                <Animated.View style={[styles.face, frontAnimatedStyle]}>
                    <FrontCard />
                </Animated.View>
                <Animated.View style={[styles.face, backAnimatedStyle]}>
                    <BackCard />
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    face: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    card: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
    },
    frontCard: {
        backgroundColor: '#1A1A1A',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    backCard: {
        backgroundColor: '#0F0F0F', // Darker for revealing
        borderColor: '#FF5500', // Highlight border
        alignItems: 'center',
        justifyContent: 'center',
    },
    patternContainer: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.5,
    },
    patternIcon: {
        position: 'absolute',
    },
    patternDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        position: 'absolute',
    },
    ribbonVertical: {
        position: 'absolute',
        left: '30%',
        top: 0,
        bottom: 0,
        width: 24,
        backgroundColor: '#FF5500',
        opacity: 0.9,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    ribbonHorizontal: {
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        height: 24,
        backgroundColor: '#FF5500',
        opacity: 0.9,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    centerBadge: {
        position: 'absolute',
        top: '40%',
        left: '30%',
        marginLeft: -20, // (64 - 24)/2 - 20 (alignment fix)
        marginTop: -20,
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerBadgeInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        transform: [{ rotate: '-15deg' }],
    },
    zordrText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FF5500',
        includeFontPadding: false,
    },
    mysteryText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#1A1A1A',
        includeFontPadding: false,
    },
    costTag: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    costText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    costTextDisabled: {
        color: '#666',
    },
    glow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FF5500',
        opacity: 0.1,
    },
    rewardContent: {
        alignItems: 'center',
        padding: 16,
        width: '100%',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 85, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 85, 0, 0.3)',
    },
    rewardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    rewardDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 16,
    },
    redeemedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FF5500',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    redeemedText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFF',
    },
});

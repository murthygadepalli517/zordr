import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    FadeIn,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Brand Colors
const COLOR_PRIMARY = '#FF5500'; // Orange
const COLOR_SECONDARY = '#7C3AED'; // Deep Purple (Complementary-ish active color)
const COLOR_ACCENT = '#EF4444'; // Red

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export const AtmosphericBackground = () => {
    // Shared Values for Orb movements
    const orb1X = useSharedValue(-50);
    const orb1Y = useSharedValue(-50);
    const orb2X = useSharedValue(width - 150);
    const orb2Y = useSharedValue(height / 2);

    // Animate Orbs loop
    useEffect(() => {
        orb1X.value = withRepeat(
            withSequence(
                withTiming(width / 2, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
                withTiming(-50, { duration: 10000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        orb1Y.value = withRepeat(
            withSequence(
                withTiming(height / 3, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
                withTiming(-50, { duration: 12000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        orb2X.value = withRepeat(
            withSequence(
                withTiming(-50, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
                withTiming(width / 2, { duration: 15000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const orb1Style = useAnimatedStyle(() => ({
        transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
    }));

    const orb2Style = useAnimatedStyle(() => ({
        transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
    }));

    return (
        <View style={styles.container} pointerEvents="none">
            {/* 1. Deep Base Background */}
            <View style={styles.base} />

            {/* 2. Moving Orbs (Using SVG Radial Gradients for smooth large glow) */}
            <Animated.View style={[styles.orb, orb1Style]}>
                <Svg height="600" width="600" viewBox="0 0 600 600">
                    <Defs>
                        <RadialGradient
                            id="grad1"
                            cx="300"
                            cy="300"
                            rx="300"
                            ry="300"
                            fx="300"
                            fy="300"
                            gradientUnits="userSpaceOnUse"
                        >
                            <Stop offset="0" stopColor={COLOR_PRIMARY} stopOpacity="0.25" />
                            <Stop offset="1" stopColor="transparent" stopOpacity="0" />
                        </RadialGradient>
                    </Defs>
                    <Rect x="0" y="0" width="600" height="600" fill="url(#grad1)" />
                </Svg>
            </Animated.View>

            <Animated.View style={[styles.orb, styles.orb2, orb2Style]}>
                <Svg height="500" width="500" viewBox="0 0 500 500">
                    <Defs>
                        <RadialGradient
                            id="grad2"
                            cx="250"
                            cy="250"
                            rx="250"
                            ry="250"
                            fx="250"
                            fy="250"
                            gradientUnits="userSpaceOnUse"
                        >
                            <Stop offset="0" stopColor={COLOR_SECONDARY} stopOpacity="0.15" />
                            <Stop offset="1" stopColor="transparent" stopOpacity="0" />
                        </RadialGradient>
                    </Defs>
                    <Rect x="0" y="0" width="500" height="500" fill="url(#grad2)" />
                </Svg>
            </Animated.View>

            {/* 4. Global Blur to blend everything seamlessly (Mesh effect) */}
            <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050505', // Almost black base
        overflow: 'hidden',
        // zIndex removed to ensure it sits in proper DOM order (layer 0)
    },
    base: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
    },
    // Orb styles unused in debug mode
    orb: {},
    orb2: {},
});

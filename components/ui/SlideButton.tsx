import React, { useRef, useState } from 'react';
import {
  View,
  Animated,
  PanResponder,
  StyleSheet,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { ChevronRight, Check, ChevronsRight } from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';

const BUTTON_HEIGHT = 64;
const BUTTON_PADDING = 6;
const SWIPE_THRESHOLD = 0.9;

interface SlideButtonProps {
  onSlideSuccess: () => Promise<void> | void;
  amount: number;
  disabled?: boolean;
}

export const SlideButton: React.FC<SlideButtonProps> = ({ onSlideSuccess, amount, disabled }) => {
  const containerWidthRef = useRef(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;

  const animWidth = containerWidthRef.current || 1;
  const maxDrag = Math.max(0, animWidth - BUTTON_HEIGHT);

  const textOpacity = translateX.interpolate({
    inputRange: [0, Math.max(1, animWidth / 2)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const fillWidth = translateX.interpolate({
    inputRange: [0, Math.max(1, maxDrag)],
    outputRange: [BUTTON_HEIGHT, animWidth],
    extrapolate: 'clamp',
  });

  const iconScale = translateX.interpolate({
    inputRange: [0, Math.max(1, animWidth)],
    outputRange: [1, 1.2],
    extrapolate: 'clamp',
  });

  const reset = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 12,
      speed: 12,
    }).start();
  };

  // Use a ref to keep track of the latest callback without re-creating PanResponder
  const onSlideSuccessRef = useRef(onSlideSuccess);

  // Update ref whenever the prop changes
  React.useEffect(() => {
    onSlideSuccessRef.current = onSlideSuccess;
  }, [onSlideSuccess]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        !isCompleted && !disabled && containerWidthRef.current > 0,
      onMoveShouldSetPanResponder: () => !isCompleted && !disabled && containerWidthRef.current > 0,
      onPanResponderGrant: () => hapticFeedback.light(),
      onPanResponderMove: (_, gestureState) => {
        if (isCompleted || disabled) return;
        const currentMaxDrag = Math.max(0, containerWidthRef.current - BUTTON_HEIGHT);
        let newX = gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > currentMaxDrag) newX = currentMaxDrag;
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isCompleted || disabled) return;
        const currentMaxDrag = Math.max(0, containerWidthRef.current - BUTTON_HEIGHT);
        if (gestureState.dx > currentMaxDrag * SWIPE_THRESHOLD) {
          setIsCompleted(true);
          hapticFeedback.success();
          Animated.spring(translateX, {
            toValue: currentMaxDrag,
            useNativeDriver: false,
            bounciness: 0,
          }).start(async () => {
            setIsLoading(true);
            try {
              await onSlideSuccessRef.current(); // Use ref here
            } catch (error) {
              hapticFeedback.error();
              setIsLoading(false);
              setIsCompleted(false);
              reset();
            }
          });
        } else {
          reset();
        }
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width !== containerWidthRef.current && width > 0) {
      containerWidthRef.current = width;
    }
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]} onLayout={onLayout}>
      {/* Green Fill Bar */}
      <Animated.View style={[styles.fillBar, { width: fillWidth }]} />

      <View style={styles.textContainer}>
        <Animated.Text style={[styles.text, { opacity: textOpacity }]}>
          Slide to Pay <Animated.Text style={styles.amount}>₹{amount}</Animated.Text>
        </Animated.Text>

        <Animated.View style={[styles.arrowHint, { opacity: textOpacity }]}>
          <ChevronsRight size={20} color="#ffffff50" />
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.thumb, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {isLoading ? (
          <ActivityIndicator color="#10B981" size="small" />
        ) : isCompleted ? (
          <Check size={28} color="#10B981" strokeWidth={4} />
        ) : (
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <ChevronRight size={32} color="#10B981" strokeWidth={3} />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BUTTON_HEIGHT,
    backgroundColor: '#1A1A1A',
    borderRadius: BUTTON_HEIGHT / 2,
    justifyContent: 'center',
    padding: BUTTON_PADDING,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  disabled: {
    opacity: 0.6,
  },
  fillBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#10B981', // Emerald Green
    borderRadius: BUTTON_HEIGHT / 2,
    opacity: 0.3, // Slight transparency for blend effect
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  amount: {
    fontWeight: '900',
    color: '#f0530aff', // Green Text
  },
  arrowHint: {
    position: 'absolute',
    right: 20,
  },
  thumb: {
    width: BUTTON_HEIGHT - BUTTON_PADDING * 2,
    height: BUTTON_HEIGHT - BUTTON_PADDING * 2,
    backgroundColor: 'white',
    borderRadius: (BUTTON_HEIGHT - BUTTON_PADDING * 2) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 2,
  },
});

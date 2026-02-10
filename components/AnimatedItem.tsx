import React from 'react';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

interface AnimatedItemProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({ children, index, delay = 100 }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * delay)
        .springify()
        .damping(12)}
      layout={Layout.springify()}
    >
      {children}
    </Animated.View>
  );
};

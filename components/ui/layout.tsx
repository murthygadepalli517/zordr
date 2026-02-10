import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ViewProps } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { cn } from '../../lib/utils';

interface LayoutProps extends ViewProps {
  safeArea?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

// Convert SafeAreaView to Animated for smooth entry
const AnimatedSafeArea = Animated.createAnimatedComponent(SafeAreaView);

export function Layout({ className, safeArea = true, edges, children, ...props }: LayoutProps) {
  if (safeArea) {
    return (
      <AnimatedSafeArea
        entering={FadeIn.duration(300)} // Smooth entry for every screen
        className={cn('flex-1 bg-background', className)}
        edges={edges}
        {...props}
      >
        {children}
      </AnimatedSafeArea>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)} // Smooth entry
      className={cn('flex-1 bg-background', className)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

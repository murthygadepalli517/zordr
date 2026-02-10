import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <View className="flex-row items-center justify-between px-2 w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <React.Fragment key={index}>
            {/* Step Item */}
            <View className="items-center gap-2 z-10">
              <AnimatedCircle
                index={index}
                status={isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}
              />
            </View>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <View className="flex-1 h-[2px] bg-white/10 mx-2 rounded-full overflow-hidden">
                <AnimatedLine isCompleted={isCompleted} />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const AnimatedCircle = ({ status, index }: { status: string; index: number }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(status === 'current' ? 1.15 : 1);
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View
        className={`w-8 h-8 rounded-full ${
          status === 'completed' || status === 'current' ? 'bg-primary' : 'bg-[#2A2A2A]'
        }`}
      />
    </Animated.View>
  );
};

const AnimatedLine = ({ isCompleted }: { isCompleted: boolean }) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(isCompleted ? 100 : 0, { duration: 400 });
  }, [isCompleted]);

  const style = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return <Animated.View className="h-full bg-primary" style={style} />;
};

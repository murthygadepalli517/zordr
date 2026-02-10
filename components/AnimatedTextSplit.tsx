import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Text } from './ui/text';

interface AnimatedTextSplitProps {
  fullText: string;
  highlightWords: string[];
  highlightClass?: string;
  baseClass?: string;
  staggerDelay?: number;
}

export function AnimatedTextSplit({
  fullText,
  highlightWords,
  highlightClass = 'text-primary',
  baseClass = 'text-white',
  staggerDelay = 80,
}: AnimatedTextSplitProps) {
  const words = fullText.split(/\s+/);
  let delayCounter = 0;

  return (
    // The container needs to allow wrapping words on multiple lines
    <View className="flex-row flex-wrap items-center justify-center px-4">
      {words.map((word, index) => {
        const cleanWord = word.replace(/[^a-zA-Z,]/g, ''); // Handles commas/punctuation
        const isHighlighted = highlightWords.includes(cleanWord);

        // Use custom component's text sizing and classes
        const className = `${isHighlighted ? highlightClass : baseClass} text-5xl font-black text-center leading-tight tracking-tight`;

        const trailingSpace = index < words.length - 1 ? ' ' : '';

        // Stagger delay calculation for each word
        const delay = delayCounter * staggerDelay;
        delayCounter++;

        return (
          <Animated.View
            // Animates the word flying up from the bottom (FadeInUp)
            key={index}
            entering={FadeInUp.delay(delay).duration(500).springify()}
            className="overflow-hidden" // Prevents overflow during the animation start
          >
            {/* Render the actual text inside the animated container */}
            <Text className={className}>
              {word}
              {trailingSpace}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

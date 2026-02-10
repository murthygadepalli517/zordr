import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface AvatarProps {
  source?: { uri: string } | number;
  size?: number;
  fallback?: string;
  style?: any;
}

export const Avatar: React.FC<AvatarProps> = ({ source, size = 40, fallback, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {source ? (
        <Image
          source={source}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : fallback ? (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.fallbackText, { fontSize: size / 2.5 }]}>
            {fallback.charAt(0).toUpperCase()}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  style?: any;
}

export const Separator: React.FC<SeparatorProps> = ({ orientation = 'horizontal', style }) => {
  const separatorStyle = orientation === 'horizontal' ? styles.horizontal : styles.vertical;

  return <View style={[separatorStyle, style]} />;
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  vertical: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

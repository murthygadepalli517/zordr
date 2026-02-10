import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5', {
  variants: {
    variant: {
      default: 'bg-primary',
      secondary: 'bg-secondary',
      destructive: 'bg-destructive',
      outline: 'border border-input',
      success: 'bg-green-500',
      warning: 'bg-orange-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  style?: any;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant, style }) => {
  const variantStyles = {
    default: styles.default,
    secondary: styles.secondary,
    destructive: styles.destructive,
    outline: styles.outline,
    success: styles.success,
    warning: styles.warning,
  };

  const variantStyle = variantStyles[variant || 'default'];

  return (
    <View style={[styles.base, variantStyle, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  default: {
    backgroundColor: '#FF5500',
  },
  secondary: {
    backgroundColor: '#6B7280',
  },
  destructive: {
    backgroundColor: '#EF4444',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  outlineText: {
    color: '#9CA3AF',
  },
  success: {
    backgroundColor: '#10B981',
  },
  warning: {
    backgroundColor: '#F59E0B',
  },
});

import React from 'react';
import { Pressable, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from './text';

const buttonVariants = cva('flex-row items-center justify-center rounded-2xl', {
  variants: {
    variant: {
      default: 'bg-primary',
      destructive: 'bg-destructive',
      outline: 'border border-white/20 bg-transparent',
      secondary: 'bg-secondary',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: {
      default: 'h-12 px-4 py-2',
      sm: 'h-10 rounded-md px-3',
      lg: 'h-14 rounded-2xl px-8',
      icon: 'h-12 w-12',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const buttonTextVariants = cva('font-bold text-base', {
  variants: {
    variant: {
      default: 'text-black',
      destructive: 'text-destructive-foreground',
      outline: 'text-white',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface ButtonProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof Pressable>, 'children'>,
    VariantProps<typeof buttonVariants> {
  label?: string;
  labelClasses?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  className,
  variant,
  size,
  label,
  labelClasses,
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable className={cn(buttonVariants({ variant, size, className }))} {...props}>
      {icon && <View className="mr-2">{icon}</View>}
      {label ? (
        <Text className={cn(buttonTextVariants({ variant }), labelClasses)}>{label}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

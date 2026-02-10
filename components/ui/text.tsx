import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      default: 'font-sans text-base',
      h1: 'font-heading text-4xl font-bold',
      h2: 'font-heading text-3xl font-bold',
      h3: 'font-heading text-2xl font-bold',
      h4: 'font-heading text-xl font-bold',
      large: 'font-sans text-lg font-semibold',
      small: 'font-sans text-sm font-medium leading-none',
      muted: 'font-sans text-sm text-muted-foreground',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    variant: 'default',
    align: 'left',
  },
});

export interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {
  className?: string;
}

export function Text({ className, variant, align, ...props }: TextProps) {
  return <RNText className={cn(textVariants({ variant, align, className }))} {...props} />;
}

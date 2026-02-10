import { View, ViewProps } from 'react-native';
import { cn } from '../../lib/utils';
import { Text, TextProps } from './text';

const Card = ({ className, ...props }: ViewProps) => (
  <View
    className={cn(
      'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
);

const CardHeader = ({ className, ...props }: ViewProps) => (
  <View className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);

const CardTitle = ({ className, ...props }: TextProps) => (
  <Text
    variant="h3"
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
);

const CardDescription = ({ className, ...props }: TextProps) => (
  <Text variant="muted" className={cn('text-sm text-muted-foreground', className)} {...props} />
);

const CardContent = ({ className, ...props }: ViewProps) => (
  <View className={cn('p-6 pt-0', className)} {...props} />
);

const CardFooter = ({ className, ...props }: ViewProps) => (
  <View className={cn('flex-row items-center p-6 pt-0', className)} {...props} />
);

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

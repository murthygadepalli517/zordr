import React, { useState } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { cn } from '../../lib/utils';

export interface InputProps extends TextInputProps {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn(
        'flex h-14 w-full rounded-2xl border bg-[#1A1A1A] px-4 py-3 text-base text-white placeholder:text-gray-500',
        isFocused ? 'border-primary bg-primary/5' : 'border-white/10',
        className
      )}
      placeholderTextColor="#6B7280"
      {...props}
    />
  );
}

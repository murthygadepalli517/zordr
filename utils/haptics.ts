import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// "3D" Haptics Wrapper
export const hapticFeedback = {
  // Subtle: For switches, toggles, small interactions
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  // Solid: For standard buttons (Add to Cart, etc.)
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  // Heavy: For destructive actions or big confirmations
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  // Rigid: Sharp, crisp feedback (iOS only, falls back to Heavy on Android)
  rigid: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  // Soft: Deep, dull thud (iOS only, falls back to Light on Android)
  soft: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  // Distinct "Tick" for pickers/sliders
  selection: () => Haptics.selectionAsync(),

  // Semantic Notifications
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

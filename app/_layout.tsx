import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../context/StoreContext';
import { AlertProvider } from '../context/AlertContext';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { AtmosphericBackground } from '../components/ui/AtmosphericBackground';

const queryClient = new QueryClient();

// Create a Transparent Theme based on DarkTheme
const TransparentTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent', // CRITICAL: This allows the AtmosphericBackground to show through
  },
};

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // 1. Register for tokens immediately on launch
    registerForPushNotificationsAsync();

    // 2. Foreground Notification Handler
    let subscription1: any;
    let subscription2: any;

    try {
      subscription1 = Notifications.addNotificationReceivedListener((notification) => {
        console.log('🔔 Foreground Notification:', notification);
      });

      // 3. Background/Killed Tap Handler (Deep Linking)
      subscription2 = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log('👆 Notification Tapped:', data);

        if (data?.type === 'order' && data?.targetId) {
          router.push({
            pathname: '/order-confirmation',
            params: { orderId: String(data.targetId) },
          });
        } else if (data?.type === 'promo') {
          router.push('/loyalty');
        }
      });
    } catch (error) {
      console.log('Notification listeners not supported in this environment');
    }

    return () => {
      if (subscription1) subscription1.remove();
      if (subscription2) subscription2.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={TransparentTheme}>
        <AlertProvider>
          <StoreProvider>
            <SafeAreaProvider>
              <StatusBar style="light" />

              {/* BACKGROUND FIX: 
                             We wrap the Stack in a black View. This prevents the "white flash" 
                             glitch seen on some Android/iOS devices during screen transitions.
                          */}
              <View style={{ flex: 1, backgroundColor: '#000000' }}>
                <AtmosphericBackground />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right', // Smooth slide transition
                    animationDuration: 200, // Snappy feel
                    contentStyle: { backgroundColor: 'transparent' },
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                  <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                </Stack>
              </View>
            </SafeAreaProvider>
          </StoreProvider>
        </AlertProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Text } from '../components/ui/text';
import { Layout } from '../components/ui/layout';

import { useStore } from '../context/StoreContext';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useStore();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/welcome');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  return (
    <Layout className="flex-1 justify-center items-center bg-black">
      <View className="absolute w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />

      <View className="items-center z-10">
        <View className="w-32 h-32 bg-white/5 rounded-[32px] border border-white/10 justify-center items-center mb-8">
          {/* Placeholder for logo if not available, or use a text fallback */}
          <Text variant="h1" className="text-4xl">
            Z
          </Text>
        </View>

        <View>
          <Text className="text-5xl font-extrabold text-white text-center mb-3">Zordr</Text>
          <Text className="text-primary text-lg font-medium tracking-widest uppercase text-center">
            Premium Dining
          </Text>
        </View>
      </View>
    </Layout>
  );
}

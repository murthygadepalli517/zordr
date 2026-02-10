import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { Layout } from '../components/ui/layout';
import { Text } from '../components/ui/text';
import { Button } from '../components/ui/button';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Layout className="flex-1 items-center justify-center px-6" safeArea>
      <AlertCircle size={80} color="#FF5500" />
      <Text variant="h1" className="mt-6 mb-2">
        Page Not Found
      </Text>
      <Text variant="muted" className="text-center mb-8">
        Sorry, we couldn't find the page you're looking for.
      </Text>
      <Button label="Go to Home" onPress={() => router.replace('/(tabs)/')} size="lg" />
    </Layout>
  );
}

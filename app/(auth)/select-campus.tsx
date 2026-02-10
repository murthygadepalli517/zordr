import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { useRouter } from 'expo-router';
import { View, FlatList, Pressable } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { useState } from 'react';

import { useStore } from '../../context/StoreContext';

// Hardcoded campuses removed - fetching dynamically
// const CAMPUSES = ...

export default function SelectCampusScreen() {
  const router = useRouter();
  const { updateUser, setSelectedCampus, campuses } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = async () => {
    if (selectedId) {
      try {
        setSelectedCampus(selectedId);
        await updateUser({ campus: selectedId });
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Failed to update campus:', error);
      }
    }
  };

  return (
    <Layout className="p-6 space-y-6">
      <View className="space-y-2">
        <Text variant="h1">Select Campus</Text>
        <Text variant="muted">Choose your location to see available menus.</Text>
      </View>

      <FlatList
        data={campuses}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedId(item.name)}>
            <Card className={cn('mb-4', selectedId === item.name && 'border-primary bg-accent/10')}>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Text variant="muted">{item.location}, {item.city}</Text>
              </CardContent>
            </Card>
          </Pressable>
        )}
      />

      <Button
        label="Continue"
        size="lg"
        disabled={!selectedId}
        className={cn(!selectedId && 'opacity-50')}
        onPress={handleContinue}
      />
    </Layout>
  );
}

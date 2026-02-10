import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ScrollView, View, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

const MENU_ITEMS = [
  {
    id: 1,
    name: 'Classic Burger',
    price: '$12.00',
    description: 'Beef patty, cheddar, lettuce, tomato',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
  },
  {
    id: 2,
    name: 'Cheese Pizza',
    price: '$14.00',
    description: 'Mozzarella, tomato sauce, basil',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500',
  },
  {
    id: 3,
    name: 'Caesar Salad',
    price: '$10.00',
    description: 'Romaine, parmesan, croutons',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500',
  },
  {
    id: 4,
    name: 'Iced Coffee',
    price: '$5.00',
    description: 'Cold brew with milk',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500',
  },
];

export default function MenuScreen() {
  const router = useRouter();

  return (
    <Layout className="flex-1" safeArea edges={['top']}>
      <View className="p-4 flex-row justify-between items-center bg-background border-b border-border">
        <Text variant="h2">Menu</Text>
        <Button size="sm" variant="outline" label="Cart (2)" onPress={() => router.push('/cart')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="space-y-4">
          {MENU_ITEMS.map((item) => (
            <Card key={item.id} className="flex-row overflow-hidden">
              <Image source={{ uri: item.image }} className="w-24 h-24 bg-muted" />
              <View className="flex-1 p-3 justify-between">
                <View>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <Text variant="muted" className="text-xs mt-1" numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mt-2">
                  <Text variant="large" className="text-primary">
                    {item.price}
                  </Text>
                  <Button size="icon" className="h-8 w-8 rounded-full">
                    <Plus size={16} color="white" />
                  </Button>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </Layout>
  );
}

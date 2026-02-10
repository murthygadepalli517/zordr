import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useStore } from '../../context/StoreContext';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Layout } from '../../components/ui/layout';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import clsx from 'clsx';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [dietary, setDietary] = useState('veg');
  const [allergies, setAllergies] = useState<string[]>([]);

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const { updateUser } = useStore();

  const handleNext = async () => {
    try {
      await updateUser({ dietaryPreference: dietary, allergies });
      router.push('/(auth)/select-campus');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <Layout className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-8 pb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-white/10 mb-6"
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text variant="h1">Personalize</Text>
          <Text variant="muted" className="mt-2">
            Customize your food experience.
          </Text>
        </View>

        <View className="px-6">
          <Card className="p-6 bg-[#1A1A1A] border-white/5 rounded-[32px]">
            {/* Avatar Upload */}
            <View className="items-center mb-8">
              <View className="relative">
                <View className="w-28 h-28 bg-black/40 rounded-full border-2 border-dashed border-white/20 items-center justify-center">
                  <Text className="text-4xl">👤</Text>
                </View>
                <View className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full items-center justify-center border-4 border-[#1A1A1A]">
                  <Camera size={20} color="white" />
                </View>
              </View>
            </View>

            {/* Dietary */}
            <View className="mb-8">
              <Text variant="small" className="mb-4 uppercase tracking-wider font-bold">
                Dietary Preference
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {['veg', 'non-veg', 'vegan'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setDietary(type)}
                    className={clsx(
                      'py-4 px-4 rounded-2xl border-2 flex-1 items-center',
                      dietary === type
                        ? 'border-primary bg-primary/10'
                        : 'border-white/5 bg-black/20'
                    )}
                  >
                    <Text
                      className={clsx(
                        'font-bold capitalize',
                        dietary === type ? 'text-primary' : 'text-gray-400'
                      )}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Allergies */}
            <View className="mb-8">
              <Text variant="small" className="mb-4 uppercase tracking-wider font-bold">
                Allergies (Optional)
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {['Nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Shellfish'].map((allergy) => {
                  const isSelected = allergies.includes(allergy);
                  return (
                    <TouchableOpacity
                      key={allergy}
                      onPress={() => toggleAllergy(allergy)}
                      className={clsx(
                        'py-2.5 px-5 rounded-full border flex-row items-center',
                        isSelected ? 'bg-white border-white' : 'border-white/20'
                      )}
                    >
                      {isSelected && <Check size={12} color="black" style={{ marginRight: 6 }} />}
                      <Text
                        className={clsx('font-bold', isSelected ? 'text-black' : 'text-gray-400')}
                      >
                        {allergy}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Button label="Next Step" onPress={handleNext} size="lg" />
          </Card>
        </View>
      </ScrollView>
    </Layout>
  );
}

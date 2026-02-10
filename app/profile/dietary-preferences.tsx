import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Check, Save, Leaf, Beef, Salad } from 'lucide-react-native';
import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { useStore } from '../../context/StoreContext';
import { hapticFeedback } from '../../utils/haptics';

const DIETARY_OPTIONS = [
  { id: 'veg', label: 'Vegetarian', icon: Leaf, color: '#22C55E' },
  { id: 'non-veg', label: 'Non-Veg', icon: Beef, color: '#EF4444' },
  { id: 'vegan', label: 'Vegan', icon: Salad, color: '#10B981' },
];

const ALLERGIES = ['Nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Shellfish'];

export default function DietaryPreferencesScreen() {
  const router = useRouter();
  const { user, updateUser } = useStore();

  const [dietary, setDietary] = useState(user?.dietaryPreference || 'veg');
  const [allergies, setAllergies] = useState<string[]>(user?.allergies || []);

  const toggleAllergy = (allergy: string) => {
    hapticFeedback.selection();
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleSave = () => {
    hapticFeedback.success();
    updateUser({ dietaryPreference: dietary, allergies });
    router.back();
  };

  return (
    <Layout className="flex-1 bg-black" safeArea>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Dietary Preferences',
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: '',
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        {/* Dietary Preference */}
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">
          I am a...
        </Text>
        <View className="gap-3 mb-8">
          {DIETARY_OPTIONS.map((opt) => {
            const isSelected = dietary === opt.id;
            const Icon = opt.icon;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => {
                  hapticFeedback.selection();
                  setDietary(opt.id);
                }}
                activeOpacity={0.9}
                className={`flex-row items-center justify-between p-5 rounded-[24px] border ${
                  isSelected ? 'bg-[#FF5500]/10 border-[#FF5500]' : 'bg-[#1A1A1A] border-white/5'
                }`}
              >
                <View className="flex-row items-center gap-4">
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${isSelected ? 'bg-[#FF5500]' : 'bg-white/10'}`}
                  >
                    <Icon size={24} color={isSelected ? 'white' : opt.color} />
                  </View>
                  <Text
                    className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}
                  >
                    {opt.label}
                  </Text>
                </View>
                {isSelected && (
                  <View className="bg-[#FF5500] rounded-full p-1">
                    <Check size={16} color="white" strokeWidth={4} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Allergies */}
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">
          I am allergic to...
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {ALLERGIES.map((allergy) => {
            const isSelected = allergies.includes(allergy);
            return (
              <TouchableOpacity
                key={allergy}
                onPress={() => toggleAllergy(allergy)}
                className={`px-6 py-3 rounded-full border ${
                  isSelected ? 'bg-white border-white' : 'bg-[#1A1A1A] border-white/10'
                }`}
              >
                <Text className={`font-bold ${isSelected ? 'text-black' : 'text-gray-400'}`}>
                  {allergy}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-black border-t border-white/10">
        <Button
          label="Save Preferences"
          onPress={handleSave}
          size="lg"
          className="bg-[#FF5500]"
          labelClasses="text-white font-bold"
        />
      </View>
    </Layout>
  );
}

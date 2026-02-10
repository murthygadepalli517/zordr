import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Save, Camera, Mail, Phone, User } from 'lucide-react-native';
import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useStore } from '../../context/StoreContext';
import { hapticFeedback } from '../../utils/haptics';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateUser } = useStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSave = () => {
    hapticFeedback.success();
    updateUser({ name, email, phone });
    router.back();
  };

  return (
    <Layout className="flex-1 bg-black" safeArea>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Personal Info',
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: '',
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Avatar Section */}
        <View className="items-center mb-10">
          <View className="relative">
            <View className="w-32 h-32 rounded-full border-4 border-[#FF5500] p-1">
              <Image
                source={{ uri: 'https://github.com/shadcn.png' }}
                className="w-full h-full rounded-full"
              />
            </View>
            <TouchableOpacity className="absolute bottom-0 right-0 bg-[#FF5500] p-2.5 rounded-full border-4 border-black">
              <Camera size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View className="gap-6">
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
              Full Name
            </Text>
            <View className="flex-row items-center bg-[#1A1A1A] rounded-2xl border border-white/10 px-4 h-14">
              <User size={20} color="#6B7280" />
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                className="flex-1 bg-transparent border-0 text-white font-bold ml-2 h-full"
                placeholderTextColor="#4B5563"
              />
            </View>
          </View>

          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
              Email Address
            </Text>
            <View className="flex-row items-center bg-[#1A1A1A] rounded-2xl border border-white/10 px-4 h-14">
              <Mail size={20} color="#6B7280" />
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 bg-transparent border-0 text-white font-bold ml-2 h-full"
                placeholderTextColor="#4B5563"
              />
            </View>
          </View>

          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
              Phone Number
            </Text>
            <View className="flex-row items-center bg-[#1A1A1A] rounded-2xl border border-white/10 px-4 h-14">
              <Phone size={20} color="#6B7280" />
              <Input
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                className="flex-1 bg-transparent border-0 text-white font-bold ml-2 h-full"
                placeholderTextColor="#4B5563"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-black border-t border-white/10">
        <Button
          label="Save Changes"
          icon={<Save size={20} color="white" />}
          onPress={handleSave}
          size="lg"
          className="bg-[#FF5500]"
          labelClasses="text-white font-bold"
        />
      </View>
    </Layout>
  );
}

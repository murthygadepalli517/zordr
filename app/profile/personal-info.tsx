import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // <-- Date picker
import { useRouter, Stack } from 'expo-router';
import { Save, Camera, Mail, Phone, User, Calendar } from 'lucide-react-native';
import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useStore } from '../../context/StoreContext';
import { hapticFeedback } from '../../utils/haptics';

const GENDER_OPTS = [
  { id: 'Male', label: 'Male' },
  { id: 'Female', label: 'Female' },
  { id: 'Other', label: 'Other' },
];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateUser } = useStore();

  // Local state for form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sync state with user from context/API
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setGender(user.gender || '');
      setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth) : null);
    }
  }, [user]);

  const handleSave = () => {
    hapticFeedback.success();
    updateUser({
      name,
      email,
      phone,
      gender,
  dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : undefined,
    });
    router.back();
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // keep picker open on iOS
    if (selectedDate) setDateOfBirth(selectedDate);
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
        {/* Avatar */}
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
          {/* Name */}
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

          {/* Email */}
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

         {/* Phone */}
            <View>
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
                Phone Number
              </Text>
              <View className="flex-row items-center bg-[#1A1A1A] rounded-2xl border border-white/10 px-4 h-14">
                <Phone size={20} color="#6B7280" />
                <Input
                  value={phone}
                  placeholder="Enter phone"
                  keyboardType="phone-pad"
                  className="flex-1 bg-transparent border-0 text-white font-bold ml-2 h-full"
                  placeholderTextColor="#4B5563"
                  editable={false} // <-- Make it uneditable
                />
              </View>
            </View>


          {/* Gender */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
              Gender
            </Text>
            <View className="flex-row gap-3">
              {GENDER_OPTS.map((opt) => {
                const isSelected = gender?.toLowerCase() === opt.id.toLowerCase();
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setGender(opt.id)}
                    className={`flex-1 py-3 rounded-2xl border ${
                      isSelected ? 'bg-[#FF5500] border-[#FF5500]' : 'bg-[#1A1A1A] border-white/10'
                    }`}
                  >
                    <Text className={`text-center font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date of Birth */}
         <View>
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
              Date of Birth
            </Text>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center bg-[#1A1A1A] rounded-2xl border border-white/10 px-4 h-14"
            >
              <Calendar size={20} color="#6B7280" />

              <View className="flex-1 justify-center ml-2">
            <Text className="text-white font-bold">
              {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Select Date'}
            </Text>
          </View>
  </TouchableOpacity>

  {showDatePicker && (
    <DateTimePicker
      value={dateOfBirth || new Date()}
      mode="date"
      display="default"
      onChange={onChangeDate}
      maximumDate={new Date()}
    />
  )}
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

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
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';



const GENDER_OPTS = [
  { id: 'Male', label: 'Male' },
  { id: 'Female', label: 'Female' },
  { id: 'Other', label: 'Other' },
];

export default function PersonalInfoScreen() {
  const router = useRouter();
const { user, updateUser, authToken } = useStore();

  // Local state for form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
const [isUploading, setIsUploading] = useState(false);
const insets = useSafeAreaInsets();
const queryClient = useQueryClient();



const requestPermissions = async () => {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (
    cameraPermission.status !== 'granted' ||
    mediaPermission.status !== 'granted'
  ) {
    Alert.alert(
      'Permission Required',
      'Camera and gallery permissions are required.'
    );
    return false;
  }

  return true;
};


const uploadProfileImage = async (imageUri: string) => {
  try {
    setIsUploading(true);

    const formData = new FormData();
    formData.append("profileImage", {
      uri: imageUri,
      name: "profile.jpg",
      type: "image/jpeg",
    } as any);

    const response = await fetch(
      "https://zordr-backend.onrender.com/api/user/profile",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (response.ok && result?.data) {
      const updatedUser = result.data;
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });




     updateUser(updatedUser);


      setProfileImage(updatedUser.profileImage);

      Alert.alert("Success", "Profile image updated!");
    } else {
      Alert.alert("Upload Failed", "Could not update image.");
    }
  } catch (error) {
    Alert.alert("Error", "Something went wrong");
  } finally {
    setIsUploading(false);
  }
};


const openImageOptions = async () => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  Alert.alert(
    'Update Profile Picture',
    'Choose an option',
    [
      {
        text: 'Take Photo',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });

         if (!result.canceled) {
            const localUri = result.assets[0].uri;

            // 👇 Instant preview before upload
            setProfileImage(localUri);

            uploadProfileImage(localUri);
          }

        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });

          if (!result.canceled) {
            uploadProfileImage(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ],
    { cancelable: true }
  );
};

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



  useEffect(() => {
  if (user?.profileImage) {
    setProfileImage(user.profileImage);
  }
}, [user?.profileImage]);


 const handleSave = async () => {
  try {
    hapticFeedback.success();

    const response = await fetch(
      "https://zordr-backend.onrender.com/api/user/profile",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name,
          email,
          gender,
          dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
        }),
      }
    );

    const result = await response.json();

    if (response.ok && result?.data) {
      updateUser(result.data);
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      Alert.alert("Success", "Profile updated!");
      router.back();
    } else {
      Alert.alert("Error", "Could not update profile.");
    }
  } catch (error) {
    Alert.alert("Error", "Something went wrong.");
  }
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

      <ScrollView contentContainerStyle={{  padding: 24,
    paddingBottom: 140 + insets.bottom, }}>
        {/* Avatar */}
        <View className="items-center mb-10">
          <View className="relative">
            <View className="w-32 h-32 rounded-full border-4 border-[#FF5500] p-1">
              <Image
                      source={{
                        uri:
                          profileImage ||
                          'https://github.com/shadcn.png',
                      }}
                className="w-full h-full rounded-full"
              />
            </View>
           <TouchableOpacity
                    onPress={openImageOptions}
                    className="absolute bottom-0 right-0 bg-[#FF5500] p-2.5 rounded-full border-4 border-black"
                  >
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
          <View
            style={{ paddingBottom: 20 + insets.bottom }}
            className="absolute bottom-0 left-0 right-0 p-6 bg-black border-t border-white/10"
          >    
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

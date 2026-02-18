import React from 'react';
import { View, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { useStore } from '../../context/StoreContext';

import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import {
  LogOut,
  ChevronRight,
  User,
  CreditCard,
  Heart,
  Bell,
  Settings,
  Gift,
  Star,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../utils/api';
import { hapticFeedback } from '../../utils/haptics';
import { Camera as CameraIcon } from 'lucide-react-native';

interface BackendProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  dietary: string;
  zCoins: number;
  profileImage?: string;
  rank: string;
  notificationPreferences?: {
    orders: boolean;
    promo: boolean;
    chat: boolean;
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const store = useStore();
  const { user, stats, authToken, logout, setLocalUser } = store;

  const [profileImage, setProfileImage] = React.useState<string | null>(
    user?.profileImage || null
  );
const [pendingImage, setPendingImage] = React.useState<string | null>(null);
const [isUploading, setIsUploading] = React.useState(false);
  /* -------------------- PERMISSIONS -------------------- */

  const requestPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (
      cameraPermission.status !== 'granted' ||
      mediaPermission.status !== 'granted'
    ) {
      Alert.alert(
        'Permission Required',
        'Camera and gallery permissions are required to update your profile picture.'
      );
      return false;
    }

    return true;
  };

  /* -------------------- IMAGE PICK + UPLOAD -------------------- */

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

    console.log("UPLOAD RESULT:", result);

   if (response.ok && result?.data?.profileImage) {
  const imageUrl = result.data.profileImage;

  setLocalUser({ profileImage: imageUrl });
  setProfileImage(imageUrl);

  Alert.alert("Success", "Profile image updated!");
} else if (response.ok) {
  Alert.alert("Success", "Profile updated successfully.");
} else {
  Alert.alert("Upload Failed", JSON.stringify(result));
}

  } catch (error) {
    console.error("Upload error:", error);
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
  const imageUri = result.assets[0].uri;
 setPendingImage(imageUri);

Alert.alert(
  "Upload Profile Picture",
  "Do you want to upload this image?",
  [
    {
      text: "Cancel",
      style: "cancel",
      onPress: () => setPendingImage(null),
    },
    {
      text: "Upload",
      onPress: () => uploadProfileImage(imageUri),
    },
  ]
);
    // mark for upload
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
  const imageUri = result.assets[0].uri;
 setPendingImage(imageUri);

Alert.alert(
  "Upload Profile Picture",
  "Do you want to upload this image?",
  [
    {
      text: "Cancel",
      style: "cancel",
      onPress: () => setPendingImage(null),
    },
    {
      text: "Upload",
      onPress: () => uploadProfileImage(imageUri),
    },
  ]
);
    // mark for upload
}

          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  /* -------------------- FETCH LIVE PROFILE -------------------- */

  const {
    data: liveUser,
    isLoading,
    error,
    isSuccess,
    isError,
  } = useQuery<BackendProfile>({
    queryKey: ['userProfile'],
    queryFn: () => apiFetch('user/profile', {}, authToken!),
    enabled: store.isAuthenticated,
  });

  React.useEffect(() => {
    if (isSuccess && liveUser) {
      const needsUpdate =
        liveUser.name !== user?.name ||
        liveUser.email !== user?.email ||
        liveUser.phone !== user?.phone ||
        liveUser.zCoins !== user?.zCoins ||
        liveUser.dietary !== user?.dietaryPreference ||
        liveUser.profileImage !== user?.profileImage;

      if (needsUpdate) {
        setLocalUser({
          name: liveUser.name,
          email: liveUser.email,
          phone: liveUser.phone,
          zCoins: liveUser.zCoins,
          dietaryPreference: liveUser.dietary,
          profileImage: liveUser.profileImage,
          notificationPreferences: liveUser.notificationPreferences,
        });

        if (liveUser.profileImage) {
          setProfileImage(liveUser.profileImage);
        }
      }
    }
  }, [
    isSuccess,
    liveUser,
    setLocalUser,
    user?.name,
    user?.email,
    user?.phone,
    user?.zCoins,
    user?.dietaryPreference,
    user?.profileImage,
  ]);

  React.useEffect(() => {
    if (!store.isAuthenticated) return;

    if (isError && error) {
      if (error.message.includes('token')) {
        Alert.alert('Session Expired', 'Please log in again.');
        logout();
      } else {
        console.error('Profile fetch error:', error.message);
      }
    }
  }, [isError, error, logout, store.isAuthenticated]);

  /* -------------------- LOGOUT -------------------- */

  const handleLogout = () => {
    hapticFeedback.warning();
    logout();
    router.replace('/(auth)/welcome');
  };

  const MENU_ITEMS = [
    { icon: User, label: 'Personal Information', route: '/profile/personal-info' },
    { icon: Gift, label: 'Coupons & Z-Points', route: '/loyalty' },
    { icon: CreditCard, label: 'Payment Methods', route: '/profile/payments' },
    { icon: Heart, label: 'Dietary Preferences', route: '/profile/dietary-preferences' },
    { icon: Star, label: 'Your Favorites', route: '/profile/favorites' },
    { icon: Bell, label: 'Notifications', route: '/profile/notification-settings' },
    { icon: Settings, label: 'Settings', route: '/profile/settings' },
  ];

  if (isLoading && store.isAuthenticated && !user) {
    return (
      <Layout className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FF5500" />
        <Text className="text-white mt-4">Loading Profile...</Text>
      </Layout>
    );
  }

  if (!store.isAuthenticated || !user) {
    return (
      <Layout className="flex-1 justify-center items-center">
        <Text className="text-white">Please log in.</Text>
      </Layout>
    );
  }

  return (
    <Layout className="flex-1 bg-black" safeArea>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="items-center pt-8 pb-8">
          <View className="relative mb-4">
            <View className="w-28 h-28 rounded-full border-[3px] border-[#FF5500] p-1">
              <Image
                source={{
                  uri:
                    profileImage ||
                    user.profileImage ||
                    'https://github.com/shadcn.png',
                }}
                className="w-full h-full rounded-full"
              />
            </View>

            <TouchableOpacity
              onPress={openImageOptions}
              activeOpacity={0.8}
              className="absolute bottom-0 right-0 bg-[#FF5500] p-2 rounded-full border-2 border-black"
            >
              <CameraIcon size={18} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-black text-white mb-1 tracking-tight">
            {user.name || 'Foodie'}
          </Text>
          <Text className="text-gray-500 text-sm font-medium">
            {user.email || user.phone}
          </Text>
        </View>

        <View className="flex-row gap-4 px-6 mb-8">
          <View className="flex-1 bg-[#1A1A1A] py-5 rounded-[24px] items-center justify-center">
            <Text className="text-white text-2xl font-bold mb-1">
              {stats.weeklyOrders ?? 0}
            </Text>
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              Orders
            </Text>
          </View>

          <View className="flex-1 bg-[#1A1A1A] py-5 rounded-[24px] items-center justify-center">
            <Text className="text-[#FF5500] text-2xl font-bold mb-1">
              {user.zCoins?.toLocaleString() ?? 0}
            </Text>
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              Z-Coins
            </Text>
          </View>
        </View>

        <View className="px-6 gap-3">
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  hapticFeedback.selection();
                  item.route && router.push(item.route as any);
                }}
                activeOpacity={0.7}
                className="flex-row items-center justify-between p-5 bg-[#1A1A1A] rounded-[20px]"
              >
                <View className="flex-row items-center gap-4">
                  <Icon size={22} color="#9CA3AF" strokeWidth={2} />
                  <Text className="font-bold text-white text-base ml-1">
                    {item.label}
                  </Text>
                </View>
                <ChevronRight size={20} color="#4B5563" />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="mt-10 mb-6 flex-row items-center justify-center gap-2"
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-red-500 font-bold text-base">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  );
}

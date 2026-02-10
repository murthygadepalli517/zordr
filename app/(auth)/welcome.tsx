import React, { useState } from 'react';
import {
  View,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../components/ui/text';
import { Phone } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { apiFetch } from '../../utils/api';
import { hapticFeedback } from '../../utils/haptics';
import { useAlert } from '../../context/AlertContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (phoneNumber.length < 10) return;

    setIsLoading(true);
    hapticFeedback.medium();

    try {
      // API Call: Send OTP
      await apiFetch('auth/send-otp', {
        method: 'POST',
        body: { phone: phoneNumber },
      });

      // On success, navigate to OTP verification
      router.push({ pathname: '/(auth)/otp-verification', params: { phone: phoneNumber } });
    } catch (error: any) {
      hapticFeedback.error();
      showAlert({
        title: 'Login Failed',
        message: error.message || 'Failed to send OTP. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || phoneNumber.length < 10;

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000' }}
      style={{ flex: 1 }}
      resizeMode="cover"
      blurRadius={8}
    >
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 40 }}
        >
          <View className="px-6 w-full">
            <View className="self-start px-4 py-2 rounded-full border border-primary mb-6 bg-black/40">
              <Text className="text-primary text-[10px] font-black uppercase tracking-[2px]">
                Skip the Queue
              </Text>
            </View>

            <View className="mb-8">
              <Text className="text-[42px] font-black text-white leading-[1.0] tracking-tight">
                Savor
              </Text>
              <Text className="text-[72px] font-black text-primary leading-[0.9] tracking-tight">
                Every
              </Text>
              <Text className="text-[42px] font-black text-primary leading-[1.0] tracking-tight">
                Moment.
              </Text>
              <Text className="text-gray-400 mt-4 text-base font-medium leading-6 max-w-[80%]">
                Pre-order your favorite meals from the best campus outlets.
              </Text>
            </View>

            <View className="bg-[#121212] p-6 rounded-[32px] border border-white/10 shadow-2xl w-full">
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-3 ml-1">
                Mobile Number
              </Text>

              <View className="flex-row items-center bg-[#1E1E1E] border border-white/10 rounded-2xl h-16 px-4 mb-6">
                <Phone size={20} color="#6b7280" />
                <View className="h-6 w-[1px] bg-white/10 mx-4" />
                <Text className="text-white font-bold text-lg mr-2">+91</Text>
                <TextInput
                  className="flex-1 text-white font-bold text-lg h-full"
                  placeholder="98765 43210"
                  placeholderTextColor="#4b5563"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  selectionColor="#FF5500"
                />
              </View>

              <TouchableOpacity
                onPress={handleContinue}
                activeOpacity={0.8}
                disabled={isButtonDisabled}
                className={`w-full h-14 rounded-2xl items-center justify-center ${isButtonDisabled ? 'bg-primary/50' : 'bg-primary'}`}
              >
                <Text className="text-white font-bold text-lg">
                  {isLoading ? 'Sending...' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

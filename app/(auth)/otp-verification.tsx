import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '../../components/ui/text';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../context/StoreContext';
import { hapticFeedback } from '../../utils/haptics';
import { useAlert } from '../../context/AlertContext';

export default function OtpVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const store = useStore();
  const { showAlert } = useAlert();
  const phone = (params.phone as string) || '9876543210';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ NEW STATES
  const [resendTimer, setResendTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  // Focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ✅ TIMER EFFECT
 useEffect(() => {
  if (!isResendDisabled) return;

  const interval = setInterval(() => {
    setResendTimer((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        setIsResendDisabled(false);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [isResendDisabled]);


  const handleOtpChange = (text: string, index: number) => {
    if (isLoading) return;

    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    if (newOtp[index] && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) return;

    setIsLoading(true);
    hapticFeedback.success();

    try {
      const response = await apiFetch('auth/verify-otp', {
        method: 'POST',
        body: { phone, otp: fullOtp },
      });

      const { user, token, isNewUser } = response;

      store.login({ user, token });

      if (isNewUser) {
        router.replace('/(auth)/sign-up');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      hapticFeedback.error();
      showAlert({
        title: 'Verification Failed',
        message: error.message || 'Invalid OTP or network error.',
        type: 'error',
        buttons: [
          {
            text: 'Try Again',
            onPress: () => {
              setOtp(['', '', '', '', '', '']);
              inputRefs.current[0]?.focus();
            },
          },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ RESEND FUNCTION
  const handleResend = async () => {
    if (isResendDisabled) return;

    setIsResendDisabled(true);
    setResendTimer(30);
    hapticFeedback.medium();

    try {
      await apiFetch('auth/send-otp', {
        method: 'POST',
        body: { phone },
      });

      showAlert({
        title: 'OTP Sent',
        message: 'A new OTP has been sent to your mobile number.',
        type: 'success',
      });
    } catch (error: any) {
      hapticFeedback.error();
      showAlert({
        title: 'Failed',
        message: error.message || 'Failed to resend OTP.',
        type: 'error',
      });
    }
  };

  const isVerifyDisabled = isLoading || otp.some((d) => d === '');

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000&auto=format&fit=crop',
      }}
      style={{ flex: 1 }}
      resizeMode="cover"
      blurRadius={8}
    >
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'flex-end',
              paddingBottom: 40,
              paddingHorizontal: 24,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-8 w-12 h-12 rounded-full bg-white/10 items-center justify-center border border-white/10 self-start"
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>

            <View className="mb-8">
              <Text className="text-4xl font-black text-white mb-2">Verify OTP</Text>
              <Text className="text-gray-400 text-base">
                Sent to <Text className="text-[#FF5500] font-bold">+91 {phone}</Text>
              </Text>
            </View>

            <View className="bg-[#121212] p-6 rounded-[32px] border border-white/10 shadow-2xl">
              <View className="flex-row justify-between mb-8 gap-2">
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                        ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                    className={`flex-1 h-14 rounded-xl border text-center text-2xl font-bold text-white bg-[#1E1E1E] ${
                      focusedIndex === index
                        ? 'border-[#FF5500] bg-[#FF5500]/10'
                        : digit
                        ? 'border-[#FF5500]/50'
                        : 'border-white/10'
                    }`}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    editable={!isLoading}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={handleVerify}
                activeOpacity={0.8}
                disabled={isVerifyDisabled}
                className={`w-full h-14 rounded-2xl flex-row items-center justify-center gap-2 ${
                  isVerifyDisabled ? 'bg-[#FF5500]/50' : 'bg-[#FF5500]'
                }`}
              >
                <Text className="text-white font-bold text-lg">
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Text>
                <ChevronRight size={20} color="white" strokeWidth={3} />
              </TouchableOpacity>

              {/* ✅ RESEND SECTION (UI unchanged, logic added) */}
              <View className="flex-row justify-center mt-6 items-center">
                <Text className="text-gray-500 font-medium">
                  Didn't receive it?{' '}
                </Text>
                <TouchableOpacity
                  disabled={isResendDisabled}
                  onPress={handleResend}
                >
                  <Text className={`font-bold ml-1 ${isResendDisabled ? 'text-gray-500' : 'text-[#FF5500]'}`}>
                    {isResendDisabled ? `Resend (${resendTimer}s)` : 'Resend'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

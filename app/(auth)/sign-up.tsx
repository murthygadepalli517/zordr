import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Search, User, Utensils, MapPin } from 'lucide-react-native';
import Animated, { FadeInRight, FadeOutLeft, FadeIn, ZoomIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { Stepper } from '../../components/Stepper';
import { useStore } from '../../context/StoreContext';
import { apiFetch } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import { hapticFeedback } from '../../utils/haptics';
import { Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';


// Hardcoded campuses removed - fetching dynamically
// const CAMPUSES = ...

const DIETARY_OPTS = [
  { id: 'Veg', icon: '🍃', label: 'Veg' },
  { id: 'Non-Veg', icon: '🍗', label: 'Non-Veg' },
  { id: 'Vegan', icon: '🥗', label: 'Vegan' },
];

const GENDER_OPTS = [
  { id: 'Male', label: 'Male' },
  { id: 'Female', label: 'Female' },
  { id: 'Other', label: 'Other' },
];


const ALLERGIES_OPTS = ['Nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Shellfish'];

export default function SignUpScreen() {
  const router = useRouter();
  const { login, setSelectedCampus, authToken, campuses } = useStore();
  const { showAlert } = useAlert();

  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [campusSearch, setCampusSearch] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  

  // Input Focus States
  const [activeInput, setActiveInput] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dietary: 'Veg',
    allergies: [] as string[],
      gender: '',
    dateOfBirth: '',
    campus: '',
  });

  const handleNext = () => {
    hapticFeedback.medium();
    if (currentStep < 2) {
      setCurrentStep((prev) => prev + 1);
    } else {
      finishSetup();
    }
  };

  const finishSetup = async () => {
    try {
      await apiFetch(
        'user/profile',
        {
          method: 'PUT',
          body: {
            name: formData.name,
            email: formData.email,
            dietary: formData.dietary,
            gender: formData.gender,
            dateOfBirth: formData.dateOfBirth,
            campus: formData.campus,
            allergies: formData.allergies,

          },
        },
        authToken || ''
      );

      login({
        user: {
          id: '',
          name: formData.name,
          email: formData.email,
          phone: '',
          dietaryPreference: formData.dietary,
          allergies: formData.allergies,
          campus: formData.campus,
          dateOfBirth:formData.dateOfBirth,
          gender:formData.gender,
          zCoins: 0,
          
        },
        token: authToken || '',
      });
      setSelectedCampus(formData.campus);
      setShowSuccess(true);
      hapticFeedback.success();
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2500);
    } catch (error: any) {
      hapticFeedback.error();
      showAlert({
        title: 'Setup Failed',
        message: error.message || 'Failed to update profile. Please try again.',
        type: 'error',
      });
    }
  };

  const toggleAllergy = (allergy: string) => {
    hapticFeedback.selection();
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  const isNextDisabled = () => {
    if (currentStep === 0) return !formData.name || !formData.email || !formData.gender || !formData.dateOfBirth;
    if (currentStep === 1) return !formData.dietary;
    if (currentStep === 2) return !formData.campus;
    return false;
  };

  // const filteredCampuses = campuses.filter(
  //   (c) =>
  //     c.name.toLowerCase().includes(campusSearch.toLowerCase()) ||
  //     c.location.toLowerCase().includes(campusSearch.toLowerCase())
  // );


  const filteredCampuses = campuses.filter(
  (c) =>
    c.name.toLowerCase().includes(campusSearch.toLowerCase()) ||
    c.location.toLowerCase().includes(campusSearch.toLowerCase())
);

const campusesToDisplay =
  campusSearch.length === 0 ? campuses : filteredCampuses;

  if (showSuccess) {
    return (
      <Layout className="flex-1 bg-black justify-center items-center p-6">
        <StatusBar style="light" />
        <Animated.View entering={ZoomIn.duration(600)} className="items-center w-full">
          <View className="w-32 h-32 bg-primary/20 rounded-full items-center justify-center mb-10 border border-primary shadow-[0_0_30px_rgba(255,85,0,0.4)]">
            <Check size={64} color="#FF5500" strokeWidth={4} />
          </View>
          <Text className="text-3xl text-white font-medium text-center mb-2">
            Hello <Text className="text-primary font-black">{formData.name.split(' ')[0]}!</Text>
          </Text>
          <Animated.Text
            entering={FadeIn.delay(400)}
            className="text-5xl font-black text-white mt-1 text-center"
          >
            Welcome to{'\n'}Zordr
          </Animated.Text>
        </Animated.View>
      </Layout>
    );
  }

  return (
    <Layout className="flex-1 bg-[#0D0D0D]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.light();
                currentStep > 0 ? setCurrentStep((p) => p - 1) : router.back();
              }}
              className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-white/10"
            >
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Stepper */}
          <View className="px-8 mb-10">
            <Stepper steps={['', '', '']} currentStep={currentStep} />
          </View>

          {/* Main Content */}
          {/* <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          > */}

          <KeyboardAwareScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid
            extraScrollHeight={100}
            showsVerticalScrollIndicator={false}
          >

            {/* STEP 1: IDENTITY */}
            {currentStep === 0 && (
              <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="space-y-8">
                <View className="items-center mt-4">
                  <View className="w-20 h-20 bg-[#1A1A1A] rounded-full items-center justify-center mb-6 border border-white/10">
                    <User size={32} color="#3b82f6" />
                  </View>
                  <Text className="text-3xl font-black text-white text-center mb-2">
                    Who are you?
                  </Text>
                  <Text className="text-gray-500 text-center font-medium">
                    So we know what to write on your cup.
                  </Text>
                </View>

                <View className="space-y-6">
                  <View className='mb-2'>
                    <Text className="text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 tracking-widest">
                      Full Name
                    </Text>
                    <TextInput
                      placeholder="John Doe"
                      placeholderTextColor="#4b5563"
                      value={formData.name}
                      onChangeText={(t) => setFormData({ ...formData, name: t })}
                      onFocus={() => setActiveInput('name')}
                      onBlur={() => setActiveInput(null)}
                      className={`h-14 bg-[#1A1A1A] rounded-2xl px-4 text-white font-bold text-lg border ${activeInput === 'name' ? 'border-primary' : 'border-white/10'}`}
                      selectionColor="#FF5500"
                    />
                  </View>
                  <View className='mb-2'>
                    <Text className="text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 tracking-widest">
                      Email Address
                    </Text>
                    <TextInput
                      placeholder="john@example.com"
                      placeholderTextColor="#4b5563"
                      value={formData.email}
                      onChangeText={(t) => setFormData({ ...formData, email: t })}
                      onFocus={() => setActiveInput('email')}
                      onBlur={() => setActiveInput(null)}
                      className={`h-14 bg-[#1A1A1A] rounded-2xl px-4 text-white font-bold text-lg border ${activeInput === 'email' ? 'border-primary' : 'border-white/10'}`}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      selectionColor="#FF5500"
                    />
                  </View>
                </View>


                              <View className='mb-2'>
                <Text className="text-[10px] font-bold text-gray-500 uppercase mb-3 ml-1 tracking-widest">
                  Gender
                </Text>
                <View className="flex-row gap-3">
                  {GENDER_OPTS.map((opt) => {
                    const isSelected = formData.gender === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => {
                          hapticFeedback.selection();
                          setFormData({ ...formData, gender: opt.id });
                        }}
                        className={`flex-1 py-3 rounded-2xl border ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-[#1A1A1A] border-white/10'
                        }`}
                      >
                        <Text
                          className={`text-center font-bold ${
                            isSelected ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                                 </View>

                          <View>
                            <Text className="text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 tracking-widest">
                              Date of Birth
                            </Text>

                            <View className="relative">
                              <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => setShowDatePicker(true)}
                                className="h-14 bg-[#1A1A1A] rounded-2xl px-4 flex-row items-center justify-between border border-white/10"
                              >
                                <Text className={`font-bold text-lg ${formData.dateOfBirth ? 'text-white' : 'text-gray-500'}`}>
                                  {formData.dateOfBirth || 'Select Date'}
                                </Text>
                                <Calendar size={20} color="#6B7280" />
                              </TouchableOpacity>
                            </View>
                          </View>


              </Animated.View>
            )}

            {/* STEP 2: PREFS */}
            {currentStep === 1 && (
              <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="space-y-8">
                <View className="items-center mt-4">
                  <View className="w-20 h-20 bg-[#1A1A1A] rounded-full items-center justify-center mb-6 border border-white/10">
                    <Utensils size={32} color="#22c55e" />
                  </View>
                  <Text className="text-3xl font-black text-white text-center mb-2">
                    Dietary Preference
                  </Text>
                  <Text className="text-gray-500 text-center font-medium">
                    We'll highlight food you can eat.
                  </Text>
                </View>

                <View className="flex-row gap-3">
                  {DIETARY_OPTS.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => {
                        hapticFeedback.selection();
                        setFormData({ ...formData, dietary: opt.id });
                      }}
                      activeOpacity={0.8}
                      className={`flex-1 aspect-square rounded-3xl items-center justify-center border-2 ${formData.dietary === opt.id ? 'bg-[#1A1A1A] border-primary' : 'bg-[#1A1A1A] border-transparent'}`}
                    >
                      <Text className="text-3xl mb-2">{opt.icon}</Text>
                      <Text
                        className={`font-bold text-sm ${formData.dietary === opt.id ? 'text-primary' : 'text-gray-500'}`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View>
                  <Text className="text-[10px] font-bold text-gray-500 uppercase mb-3 ml-1 tracking-widest">
                    Allergies (Optional)
                  </Text>
                  <View className="flex-row flex-wrap gap-3">
                    {ALLERGIES_OPTS.map((allergy) => {
                      const isSelected = formData.allergies.includes(allergy);
                      return (
                        <TouchableOpacity
                          key={allergy}
                          onPress={() => toggleAllergy(allergy)}
                          className={`px-5 py-3 rounded-2xl border ${isSelected ? 'bg-white border-white' : 'bg-[#1A1A1A] border-white/5'}`}
                        >
                          <Text
                            className={`font-bold text-sm ${isSelected ? 'text-black' : 'text-gray-400'}`}
                          >
                            {allergy}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </Animated.View>
            )}

            {/* STEP 3: CAMPUS */}
           {/* STEP 3: CAMPUS */}
{currentStep === 2 && (
  <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="space-y-6">
    <View className="items-center mt-4">
      <View className="w-20 h-20 bg-[#1A1A1A] rounded-full items-center justify-center mb-6 border border-white/10">
        <MapPin size={32} color="#FF5500" />
      </View>
      <Text className="text-3xl font-black text-white text-center mb-2">
        Select Campus
      </Text>
      <Text className="text-gray-500 text-center font-medium">
        Where are you ordering from today?
      </Text>
    </View>

    {/* Search Input */}
    <View className="relative">
      <View className="absolute left-4 top-[18px] z-10">
        <Search size={20} color="#6B7280" />
      </View>

      <TextInput
        placeholder="Search college (e.g. KITSW)..."
        placeholderTextColor="#4b5563"
        value={campusSearch}
        onChangeText={(text) => {
          setCampusSearch(text);
          setFormData({ ...formData, campus: '' }); // reset selection while typing
        }}
        onFocus={() => setActiveInput('search')}
        onBlur={() => setTimeout(() => setActiveInput(null), 150)}
        className={`h-14 bg-[#1A1A1A] rounded-2xl pl-12 pr-4 text-white font-bold text-base border ${
          activeInput === 'search' ? 'border-primary' : 'border-white/10'
        }`}
        selectionColor="#FF5500"
      />

      {/* Dropdown Results */}
      {/* {campusSearch.length > 0 && filteredCampuses.length > 0 && ( */}
      {activeInput === 'search' && campusesToDisplay.length > 0 && (

          <View className="mt-2 bg-[#1A1A1A] rounded-2xl border border-white/10 max-h-60">
          <ScrollView keyboardShouldPersistTaps="handled">
            {/* {filteredCampuses.map((campus) => ( */}
            {campusesToDisplay.map((campus) => (

              <TouchableOpacity
                key={campus.name}
                onPress={() => {
                  hapticFeedback.selection();
                  setFormData({ ...formData, campus: campus.name });
                  setCampusSearch(campus.name); // fill input
                }}
                className="p-4 border-b border-white/5"
              >
                <Text className="font-bold text-white">
                  {campus.name}
                </Text>
                <Text className="text-gray-500 text-xs">
                  {campus.location}, {campus.city}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>

    {/* Selected Campus Preview */}
    {formData.campus !== '' && (
      <View className="mt-6 p-4 bg-primary/10 border border-primary rounded-2xl">
        <Text className="text-primary font-bold text-lg">
          Selected: {formData.campus}
        </Text>
      </View>
    )}
  </Animated.View>
)}
          </KeyboardAwareScrollView>



                   {showDatePicker && (
                      <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={(event, selectedDate) => {
                          if (selectedDate) {
                            setShowDatePicker(false);
                            setTempDate(selectedDate);

                            const formatted = selectedDate.toISOString().split('T')[0];
                            setFormData({ ...formData, dateOfBirth: formatted });
                          } else {
                            setShowDatePicker(false);
                          }
                        }}
                      />
                    )}


          {/* Footer */}
          <View className="p-6 bg-[#0D0D0D] border-t border-white/5">
            <TouchableOpacity
              onPress={handleNext}
              disabled={isNextDisabled()}
              className={`h-14 rounded-2xl items-center justify-center ${isNextDisabled() ? 'bg-[#1A1A1A]' : 'bg-primary'}`}
            >
              <Text
                className={`font-bold text-lg ${isNextDisabled() ? 'text-gray-500' : 'text-white'}`}
              >
                {currentStep === 2 ? 'Finish Setup' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Layout>
  );
}

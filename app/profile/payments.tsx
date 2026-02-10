import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Plus, Trash2, CheckCircle, Wallet, Smartphone } from 'lucide-react-native';
import { Layout } from '../../components/ui/layout';
import { Text } from '../../components/ui/text';
import { hapticFeedback } from '../../utils/haptics';

const MOCK_PAYMENTS = [
  { id: 1, type: 'Google Pay', details: 'gourav@oksbi', isDefault: true, icon: Smartphone },
  { id: 2, type: 'PhonePe', details: '9876543210@ybl', isDefault: false, icon: Wallet },
];

export default function PaymentsScreen() {
  const router = useRouter();
  const [payments, setPayments] = useState(MOCK_PAYMENTS);

  const handleRemove = (id: number) => {
    hapticFeedback.warning();
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSetDefault = (id: number) => {
    hapticFeedback.selection();
    setPayments((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));
  };

  return (
    <Layout className="flex-1 bg-black" safeArea>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Payment Methods',
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: '',
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <View className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-6">
          <Text className="text-blue-400 font-bold text-xs mb-1">UPI ONLY</Text>
          <Text className="text-blue-400/70 text-xs leading-5">
            To ensure fast and contactless transactions, we currently support only UPI payment
            methods.
          </Text>
        </View>

        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">
          Saved UPI IDs
        </Text>

        <View className="gap-4 mb-8">
          {payments.map((payment) => (
            <TouchableOpacity
              key={payment.id}
              onPress={() => handleSetDefault(payment.id)}
              activeOpacity={0.9}
              className={`flex-row items-center justify-between p-5 rounded-[24px] border ${
                payment.isDefault
                  ? 'bg-[#FF5500]/10 border-[#FF5500]/50'
                  : 'bg-[#1A1A1A] border-white/5'
              }`}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className={`w-12 h-12 rounded-2xl items-center justify-center ${
                    payment.isDefault ? 'bg-[#FF5500]' : 'bg-white/10'
                  }`}
                >
                  <payment.icon size={24} color={payment.isDefault ? 'white' : '#9CA3AF'} />
                </View>
                <View>
                  <Text
                    className={`font-bold text-lg ${payment.isDefault ? 'text-white' : 'text-gray-300'}`}
                  >
                    {payment.type}
                  </Text>
                  <Text className="text-sm text-gray-500">{payment.details}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4">
                {payment.isDefault ? (
                  <CheckCircle size={24} color="#FF5500" fill="#FF5500" />
                ) : (
                  <TouchableOpacity
                    onPress={() => handleRemove(payment.id)}
                    className="p-2 bg-white/5 rounded-full"
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add New Button */}
        <TouchableOpacity
          onPress={() => hapticFeedback.medium()}
          className="flex-row items-center justify-center gap-3 bg-[#1A1A1A] border border-dashed border-white/20 p-5 rounded-[24px] active:bg-white/5"
        >
          <Plus size={24} color="#FF5500" />
          <Text className="text-white font-bold text-base">Add New UPI ID</Text>
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  );
}

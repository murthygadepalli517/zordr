import { View, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text } from "../components/ui/text";
import RazorpayCheckout from "react-native-razorpay";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PaymentFailed() {

const router = useRouter();
const { orderId } = useLocalSearchParams();




const cancelOrderHandler = async () => {
  try {
    const { apiFetch } = require("../utils/api");

    const token = (await AsyncStorage.getItem("authToken")) || "";

    await apiFetch(
      `orders/${orderId}/cancel`,
      {
        method: "POST",
        body: {
          reason: "Payment not completed",
        },
      },
      token
    );

    router.replace("/"); // redirect to home after cancel
  } catch (error) {
    console.error("Cancel order failed:", error);
  }
};

const retryPayment = async () => {

  const { apiFetch } = require("../utils/api");

  const paymentOrder = await apiFetch(
    "payments/create-order",
    {
      method: "POST",
      body: { orderId }
    },
    await AsyncStorage.getItem("authToken") || ""
  );

  const options = {
    description: "Campus Food Order",
    currency: "INR",
    key: "rzp_test_S7KeATm2fFOCTu",
    amount: paymentOrder.amount,
    order_id: paymentOrder.razorpayOrderId,
    name: "Zordr",
  };

  RazorpayCheckout.open(options)
    .then(async (data:any) => {

      await apiFetch(
        "payments/verify",
        {
          method: "POST",
          body: {
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
            orderId
          }
        },
        await AsyncStorage.getItem("authToken") || ""
      );

      router.replace({
        pathname: "/order-confirmation",
        params: { orderId }
      });

    })
    .catch(() => {});
};

return (

<View className="flex-1 bg-black items-center justify-center px-6">

<Text className="text-white text-2xl font-bold mb-4">
Payment Failed
</Text>

<Text className="text-gray-400 text-center mb-10">
Your order is created but payment was not completed.
</Text>

<TouchableOpacity
onPress={retryPayment}
className="bg-primary px-8 py-4 rounded-xl mb-4"
>
<Text className="text-white font-bold">
Retry Payment
</Text>
</TouchableOpacity>

<TouchableOpacity
onPress={() => router.replace('/(tabs)/')}
className="border border-red-500/30 px-8 py-4 rounded-xl"
>
<Text className="text-red-500 font-bold">
Cancel
</Text>
</TouchableOpacity>
</View>

);
}
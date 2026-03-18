import { View, TouchableOpacity, BackHandler } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text } from "../components/ui/text";
import RazorpayCheckout from "react-native-razorpay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStore } from "../context/StoreContext";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

export default function PaymentFailed() {

const router = useRouter();
const { orderId } = useLocalSearchParams();
const { cancelOrder } = useStore();
const appState = useRef(AppState.currentState);

const isLeavingRef = useRef(false);



useEffect(() => {
  const subscription = AppState.addEventListener("change", (nextState) => {

    if (
      appState.current === "active" &&
      nextState.match(/inactive|background/)
    ) {
      if (!isLeavingRef.current && orderId) {
        cancelOrder(orderId as string, "UNABLE_TO_REACH");
      }
    }

    appState.current = nextState;
  });

  return () => {
    subscription.remove();
  };
}, [orderId]);

useEffect(() => {

  const backAction = () => {

    if (!isLeavingRef.current && orderId) {
      cancelOrder(orderId as string, "UNABLE_TO_REACH");
    }

    router.replace("/(tabs)/");
    return true;
  };

  const backHandler = BackHandler.addEventListener(
    "hardwareBackPress",
    backAction
  );

  return () => backHandler.remove();

}, [orderId]);

const cancelOrderHandler = async () => {

  if (!orderId) return;

  isLeavingRef.current = true;

  cancelOrder(orderId as string, "UNABLE_TO_REACH");

  router.replace("/(tabs)/");
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

      isLeavingRef.current = true;

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
onPress={cancelOrderHandler}
className="border border-red-500/30 px-8 py-4 rounded-xl"
>
<Text className="text-red-500 font-bold">
Cancel
</Text>
</TouchableOpacity>

</View>
);
}
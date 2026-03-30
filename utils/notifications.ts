import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is OPEN
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.log('Error setting notification handler:', error);
}

export async function registerForPushNotificationsAsync() {
  // Check if running in Expo Go
  if (Constants.executionEnvironment === 'storeClient') {
    console.log('Push notifications are not supported in Expo Go');
    return;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      // Get the token that uniquely identifies this device
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      const tokenResult = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = tokenResult.data;
      console.log('📲 Expo Push Token:', token);

      // Also get the native device token (FCM for Android, APNS for iOS)
      try {
        const deviceTokenResult = await Notifications.getDevicePushTokenAsync();
        const deviceToken = deviceTokenResult.data;
        console.log('📲 Native Device Token:', deviceToken);
        return { expoToken: token, deviceToken };
      } catch (nativeError: any) {
        console.log('⚠️ Native token error (FCM/APNS):', nativeError.message);
        if (Platform.OS === 'android' && nativeError.message.includes('FirebaseApp is not initialized')) {
          console.warn('❌ Firebase is not initialized. If you just added google-services.json, please run: npx expo run:android --clean');
        }
        // Return only expoToken if native token fails
        return { expoToken: token, deviceToken: null };
      }
    } catch (e: any) {
      console.log('❌ Error getting push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return null;
}

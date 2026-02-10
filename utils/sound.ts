import { Audio } from 'expo-av';

// Sound URLs (using reliable CDNs or public assets)
const SOUNDS = {
  order_placed: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Cash register
  order_confirmed: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3', // Success chime
  order_preparing: 'https://assets.mixkit.co/active_storage/sfx/2579/2579-preview.mp3', // Cooking/Sizzle or generic notification
  order_ready: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Bell ding
  order_pickup: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', // Success fanfare
  success: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
};

export type SoundType = keyof typeof SOUNDS;

export const playSound = async (type: SoundType) => {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri: SOUNDS[type] }, { shouldPlay: true });

    // Unload sound after playback to free resources
    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.isLoaded && status.didJustFinish) {
        await sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log('Error playing sound:', error);
  }
};

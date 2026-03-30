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

const getAudioEngine = () => {
  try {
    // Try to require expo-audio. If it's not linked, this might throw or return empty.
    const ExpoAudio = require('expo-audio');
    if (ExpoAudio && ExpoAudio.createAudioPlayer) {
      return { type: 'expo-audio' as const, engine: ExpoAudio };
    }
  } catch (e) {
    // expo-audio not available
  }

  try {
    const ExpoAV = require('expo-av');
    if (ExpoAV && ExpoAV.Audio) {
      return { type: 'expo-av' as const, engine: ExpoAV.Audio };
    }
  } catch (e) {
    // expo-av not available
  }

  return null;
};

export const playSound = async (type: SoundType) => {
  const audio = getAudioEngine();
  
  if (!audio) {
    console.log('No audio engine available');
    return;
  }

  try {
    if (audio.type === 'expo-audio') {
      const player = audio.engine.createAudioPlayer(SOUNDS[type]);
      player.play();
    } else {
      // Fallback to expo-av
      const { sound } = await audio.engine.Sound.createAsync(
        { uri: SOUNDS[type] },
        { shouldPlay: true }
      );
      // Clean up sound after playback
      sound.setOnPlaybackStatusUpdate(async (status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    }
  } catch (error) {
    console.log('Error playing sound:', error);
  }
};

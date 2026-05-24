import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_STORAGE_KEY = 'has_seen_welcome';

export const shouldShowWelcome = async (): Promise<boolean> => {
  try {
    const hasSeenWelcome = await AsyncStorage.getItem(WELCOME_STORAGE_KEY);

    return !hasSeenWelcome;
  } catch (error) {
    console.error('Hoş geldiniz durumu okunamadı:', error);

    return false;
  }
};

export const markWelcomeSeen = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(WELCOME_STORAGE_KEY, 'true');
  } catch (error) {
    console.error('Hoş geldiniz durumu kaydedilemedi:', error);
  }
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_STORAGE_KEY = 'has_seen_welcome';
const HAS_LOGGED_IN_KEY = 'has_logged_in_before';

export const hasLoggedInBefore = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(HAS_LOGGED_IN_KEY);

    return value === 'true';
  } catch (error) {
    console.error('Giriş geçmişi okunamadı:', error);

    return false;
  }
};

export const markLoggedInBefore = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(HAS_LOGGED_IN_KEY, 'true');
  } catch (error) {
    console.error('Giriş geçmişi kaydedilemedi:', error);
  }
};

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

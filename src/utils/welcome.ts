import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const checkFirstTime = async () => {
  try {
    const hasSeenWelcome = await AsyncStorage.getItem('has_seen_welcome');
    if (!hasSeenWelcome) {
      Alert.alert(
        "Yolista'ya Hoş Geldiniz! 👋",
        'Yolista ile şehrinizi keşfedin, yeni rotalar bulun ve unutulmaz deneyimler yaşayın. Şehir içi, doğa ve tarihi rotaları keşfetmeye başlayın!',
        [
          {
            text: 'Harika!',
            onPress: async () => {
              await AsyncStorage.setItem('has_seen_welcome', 'true');
            },
          },
        ],
      );
    }
  } catch (error) {
    console.error('Hoş geldiniz mesajı hatası:', error);
  }
};

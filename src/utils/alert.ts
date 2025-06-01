import Toast from 'react-native-toast-message';

export const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string, visibilityTime: number = 2000) => {
  Toast.show({
    type: type, // e.g., "success", "error", or "info"
    text1: title || '',
    text2: message || '',

    text1Style: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    text2Style: {
      fontSize: 14,
    },
    visibilityTime: visibilityTime,
  });
};

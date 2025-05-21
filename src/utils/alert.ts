import Toast from 'react-native-toast-message';

export const showToast = (type: string, message: string,title?: string, visibilityTime: number = 2000) => {
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
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        
      },
      visibilityTime: visibilityTime,
    });
  };
  
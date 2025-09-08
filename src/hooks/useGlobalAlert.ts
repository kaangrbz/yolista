import { useAlert } from '../context/AlertContext';
import Clipboard from '@react-native-clipboard/clipboard';

export const useGlobalAlert = () => {
  const { showAlert: showAlertContext } = useAlert();

  const showAlert = (message: string, duration?: number) => {
    showAlertContext({
      message,
      duration: duration || 3000,
    });
  };

  const copyToClipboard = async (text: string, successMessage?: string) => {
    try {
      await Clipboard.setString(text);
      showAlert(successMessage || 'Panoya kopyalandı');
    } catch (error) {
      showAlert('Panoya kopyalanamadı');
    }
  };

  const showActionAlert = (
    message: string,
    actionLabel: string,
    onAction: () => void,
    duration?: number
  ) => {
    showAlertContext({
      message,
      duration: duration || 5000,
      action: {
        label: actionLabel,
        onPress: onAction,
      },
    });
  };

  return {
    showAlert,
    copyToClipboard,
    showActionAlert,
  };
};

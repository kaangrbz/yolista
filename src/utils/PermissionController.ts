import { Alert, Platform } from 'react-native';
import { check, request, RESULTS, openSettings, PERMISSIONS } from 'react-native-permissions';
import { showToast } from './alert';

const isIOS = Platform.OS === 'ios';

export async function requestFilePermission(): Promise<boolean> {
  try {
    const permission = isIOS
      ? PERMISSIONS.IOS.PHOTO_LIBRARY
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

    const result = await check(permission);

    switch (result) {
      case RESULTS.UNAVAILABLE:
        showToast('error', 'Permission Unavailable', 'This feature is not available on your device.');
        return false;

      case RESULTS.DENIED:
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;

      case RESULTS.GRANTED:
        console.log('File Permission granted');
        return true;

      case RESULTS.BLOCKED:
        showToast('error', 'Permission Denied', 'Permission is blocked. Please enable it in app settings.');
        return false;

      default:
        return false;
    }
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
}

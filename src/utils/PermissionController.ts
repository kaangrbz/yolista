import { Alert, Platform } from 'react-native';
import { check, request, RESULTS, openSettings, PERMISSIONS } from 'react-native-permissions';
import { showToast } from './alert';

const isIOS = Platform.OS === 'ios';
const isAndroid13OrHigher = Platform.OS === 'android' && Platform.Version >= 33;

export async function requestFilePermission(): Promise<boolean> {
  try {
    if (isAndroid13OrHigher) {
      // Android 13+ uses new granular permissions
      // We only need images and video for now
      const permissions = [
        PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
        PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
      ];

      let allGranted = true;
      for (const permission of permissions) {
        const result = await check(permission);
        console.log('Permission result:', permission, result);
        
        switch (result) {
          case RESULTS.UNAVAILABLE:
            showToast('error', 'Permission Unavailable', 'This feature is not available on your device.');
            return false;

          case RESULTS.DENIED:
            const requestResult = await request(permission);
            if (requestResult !== RESULTS.GRANTED) {
              allGranted = false;
            }
            break;

          case RESULTS.BLOCKED:
            Alert.alert(
              'Permission Required',
              'Please enable media access in app settings to continue.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Open Settings',
                  onPress: () => openSettings(),
                },
              ]
            );
            return false;
        }
      }
      return allGranted;
    } else {
      // For iOS and Android 12 and below
      const permission = isIOS 
        ? PERMISSIONS.IOS.PHOTO_LIBRARY 
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

      const result = await check(permission);
      console.log('Permission result:', permission, result);

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
          Alert.alert(
            'Permission Required',
            'Please enable photo access in app settings to continue.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => openSettings(),
              },
            ]
          );
          return false;

        default:
          return false;
      }
    }
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
}

export async function requestCameraPermission(): Promise<boolean> {
  try {
    const permission = isIOS
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA;

    const result = await check(permission);

    switch (result) {
      case RESULTS.UNAVAILABLE:
        showToast('error', 'Permission Unavailable', 'Camera is not available on your device.');
        return false;

      case RESULTS.DENIED:
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;

      case RESULTS.GRANTED:
        console.log('Camera Permission granted');
        return true;

      case RESULTS.BLOCKED:
        Alert.alert(
          'Permission Required',
          'Please enable camera access in app settings to continue.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => openSettings(),
            },
          ]
        );
        return false;

      default:
        return false;
    }
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
}

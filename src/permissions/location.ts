import { Platform } from 'react-native';
import {
  check,
  checkLocationAccuracy,
  PERMISSIONS,
  PermissionStatus,
  request,
  RESULTS,
} from 'react-native-permissions';
import {
  handleBlocked,
} from './permissionService';
import { PermissionResult } from './types';

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';
const isAndroid12OrHigher = isAndroid && Number(Platform.Version) >= 31;
const isIOS14OrHigher = isIOS && Number.parseInt(String(Platform.Version), 10) >= 14;

const statusToResult = (status: PermissionStatus): PermissionResult => {
  if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
    return 'granted';
  }

  if (status === RESULTS.BLOCKED) {
    return 'blocked';
  }

  if (status === RESULTS.UNAVAILABLE) {
    return 'unavailable';
  }

  return 'denied';
};

const logAccuracyIfAvailable = async () => {
  if (!isIOS14OrHigher) {
    return;
  }

  try {
    const accuracy = await checkLocationAccuracy();

    if (accuracy === 'reduced') {
      console.log('Location accuracy: reduced (approximate)');
    } else {
      console.log('Location accuracy: full (precise)');
    }
  } catch (err) {
    console.log('checkLocationAccuracy unavailable:', err);
  }
};

/**
 * Konum izni özel akışı.
 *
 * - iOS: LOCATION_WHEN_IN_USE. iOS 14+ için accuracy bilgisi loglanır.
 * - Android 12+: Manifest'te FINE ve COARSE birlikte declare edildiği için
 *   `request(ACCESS_FINE_LOCATION)` sistem dialog'unda "Precise / Approximate / Deny"
 *   üçlü seçeneğini açar. Kullanıcı "Approximate" seçerse FINE denied döner
 *   ama COARSE granted olur — biz bu durumu da `granted` kabul ederiz.
 * - Android 11 ve altı: Sadece FINE yeterli.
 */
export const requestLocationPermission = async (): Promise<PermissionResult> => {
  if (isIOS) {
    const permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    const current = await check(permission);
    const currentResult = statusToResult(current);

    if (currentResult === 'granted') {
      await logAccuracyIfAvailable();

      return 'granted';
    }

    if (currentResult === 'blocked') {
      handleBlocked('location', 'blocked');

      return 'blocked';
    }

    if (currentResult === 'unavailable') {
      return 'unavailable';
    }

    const requested = statusToResult(await request(permission));

    if (requested === 'blocked') {
      handleBlocked('location', 'blocked');
    }

    if (requested === 'granted') {
      await logAccuracyIfAvailable();
    }

    return requested;
  }

  if (!isAndroid) {
    return 'unavailable';
  }

  const fine = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  const coarse = PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION;

  const currentFine = statusToResult(await check(fine));
  const currentCoarse = statusToResult(await check(coarse));

  if (currentFine === 'granted' || currentCoarse === 'granted') {
    return 'granted';
  }

  if (currentFine === 'blocked' || currentCoarse === 'blocked') {
    handleBlocked('location', 'blocked');

    return 'blocked';
  }

  if (!isAndroid12OrHigher) {
    const result = statusToResult(await request(fine));

    if (result === 'blocked') {
      handleBlocked('location', 'blocked');
    }

    return result;
  }

  // Android 12+: FINE request edildiğinde sistem dialog'unda Precise/Approximate seçimi sunar.
  const fineRequested = statusToResult(await request(fine));

  if (fineRequested === 'granted') {
    return 'granted';
  }

  // Kullanıcı Approximate seçtiyse FINE denied döner ama COARSE granted olabilir.
  const coarseStatus = statusToResult(await check(coarse));

  if (coarseStatus === 'granted') {
    return 'granted';
  }

  if (fineRequested === 'blocked' || coarseStatus === 'blocked') {
    handleBlocked('location', 'blocked');

    return 'blocked';
  }

  // FINE denied edildi, COARSE da yok — son şans olarak COARSE'u explicit iste.
  const coarseRequested = statusToResult(await request(coarse));

  if (coarseRequested === 'blocked') {
    handleBlocked('location', 'blocked');
  }

  return coarseRequested;
};

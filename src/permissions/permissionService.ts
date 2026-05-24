import { Alert } from 'react-native';
import {
  check,
  openSettings,
  Permission,
  PermissionStatus,
  request,
  RESULTS,
} from 'react-native-permissions';
import { getBlockedMessage } from './messages';
import { getNativePermissions } from './nativePermissionMap';
import { PermissionKind, PermissionResult } from './types';

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

const combineResults = (results: PermissionResult[]): PermissionResult => {
  if (results.length === 0) {
    return 'unavailable';
  }

  if (results.every((result) => result === 'granted')) {
    return 'granted';
  }

  if (results.some((result) => result === 'blocked')) {
    return 'blocked';
  }

  if (results.some((result) => result === 'unavailable')) {
    return 'unavailable';
  }

  return 'denied';
};

const showBlockedAlert = (kind: PermissionKind) => {
  const { title, body } = getBlockedMessage(kind);

  Alert.alert(title, body, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Ayarları Aç', onPress: () => openSettings() },
  ]);
};

export const checkNativePermissions = async (
  permissions: Permission[],
): Promise<PermissionResult> => {
  if (permissions.length === 0) {
    return 'unavailable';
  }

  const statuses = await Promise.all(permissions.map((permission) => check(permission)));
  const results = statuses.map(statusToResult);

  return combineResults(results);
};

export const requestNativePermissions = async (
  permissions: Permission[],
): Promise<PermissionResult> => {
  if (permissions.length === 0) {
    return 'unavailable';
  }

  const statuses: PermissionStatus[] = [];

  for (const permission of permissions) {
    const status = await request(permission);
    statuses.push(status);
  }

  const results = statuses.map(statusToResult);

  return combineResults(results);
};

export const handleBlocked = (kind: PermissionKind, result: PermissionResult): void => {
  if (result === 'blocked') {
    showBlockedAlert(kind);
  }
};

export const checkPermission = async (kind: PermissionKind): Promise<PermissionResult> => {
  const permissions = getNativePermissions(kind);

  return checkNativePermissions(permissions);
};

export const requestPermission = async (
  kind: PermissionKind,
): Promise<PermissionResult> => {
  const permissions = getNativePermissions(kind);

  if (permissions.length === 0) {
    return 'unavailable';
  }

  const currentStatus = await checkNativePermissions(permissions);

  if (currentStatus === 'granted') {
    return 'granted';
  }

  if (currentStatus === 'blocked') {
    showBlockedAlert(kind);

    return 'blocked';
  }

  if (currentStatus === 'unavailable') {
    return 'unavailable';
  }

  const requested = await requestNativePermissions(permissions);

  if (requested === 'blocked') {
    showBlockedAlert(kind);
  }

  return requested;
};

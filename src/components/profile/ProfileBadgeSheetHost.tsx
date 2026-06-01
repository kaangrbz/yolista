import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import type { ProfileBadge } from '../../model/profile.model';
import ProfileBadgeInfoSheet from './ProfileBadgeInfoSheet';

type BadgeSheetState = { id: number; badge: ProfileBadge } | null;

type Listener = (state: BadgeSheetState) => void;

let currentState: BadgeSheetState = null;
const listeners = new Set<Listener>();
let idCounter = 0;

function setState(next: BadgeSheetState) {
  currentState = next;
  listeners.forEach((listener) => listener(next));
}

export function showProfileBadgeSheet(badge: ProfileBadge): void {
  idCounter += 1;
  setState({ id: idCounter, badge });
}

export function hideProfileBadgeSheet(): void {
  setState(null);
}

export const ProfileBadgeSheetHost: React.FC = () => {
  const [state, setLocalState] = useState<BadgeSheetState>(currentState);

  useEffect(() => {
    const listener: Listener = (next) => setLocalState(next);
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!state) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      hideProfileBadgeSheet();
      return true;
    });

    return () => subscription.remove();
  }, [state]);

  if (!state) {
    return null;
  }

  return (
    <View style={styles.host} pointerEvents="box-none">
      <ProfileBadgeInfoSheet
        badge={state.badge}
        onClose={hideProfileBadgeSheet}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
  },
});

export default ProfileBadgeSheetHost;

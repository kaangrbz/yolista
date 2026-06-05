import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import type { Achievement } from '../../model/achievement.model';
import AchievementInfoSheet from './AchievementInfoSheet';

type SheetState = { id: number; achievement: Achievement; locked: boolean } | null;

type Listener = (state: SheetState) => void;

let currentState: SheetState = null;
const listeners = new Set<Listener>();
let idCounter = 0;

function setState(next: SheetState) {
  currentState = next;
  listeners.forEach((listener) => listener(next));
}

export function showAchievementSheet(achievement: Achievement, locked = false): void {
  idCounter += 1;
  setState({ id: idCounter, achievement, locked });
}

export function hideAchievementSheet(): void {
  setState(null);
}

export const AchievementSheetHost: React.FC = () => {
  const [state, setLocalState] = useState<SheetState>(currentState);

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
      hideAchievementSheet();
      return true;
    });
    return () => subscription.remove();
  }, [state]);

  if (!state) {
    return null;
  }

  return (
    <AchievementInfoSheet
      achievement={state.achievement}
      locked={state.locked}
      onClose={hideAchievementSheet}
    />
  );
};

export default AchievementSheetHost;

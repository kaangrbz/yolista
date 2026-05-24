import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCreateFlowBackHandler } from './useCreateFlowPreventRemove';
import type { WizardStep } from '../types/createRouteFlowTypes';

export function useCreateFlowAndroidBack(wizardStep: WizardStep): void {
  const handleBackPress = useCreateFlowBackHandler(wizardStep);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

      return () => subscription.remove();
    }, [handleBackPress]),
  );
}

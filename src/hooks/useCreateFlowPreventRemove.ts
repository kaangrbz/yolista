import { useCallback } from 'react';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useCreateRouteFlowStore } from '../store/createRouteFlowStore';
import { showCreateFlowExitAlert } from '../utils/createFlowExitGuard';
import type { WizardStep } from '../types/createRouteFlowTypes';

function selectShouldPreventRemove(state: ReturnType<typeof useCreateRouteFlowStore.getState>): boolean {
  if (state.photos.length > 0) {
    return true;
  }

  const hasStopText = state.routeStops.some(
    (stop) => stop.title.trim().length > 0 || (stop.description || '').trim().length > 0,
  );

  if (hasStopText) {
    return true;
  }

  if (state.anyUploadInProgress()) {
    return true;
  }

  return state.isDirty;
}

export function useCreateFlowPreventRemove(wizardStep: WizardStep): void {
  const navigation = useNavigation();
  const shouldPrevent = useCreateRouteFlowStore(selectShouldPreventRemove);

  usePreventRemove(shouldPrevent, ({ data }) => {
    showCreateFlowExitAlert(
      navigation as { goBack: () => void; navigate: (name: string, params?: object) => void },
      wizardStep,
      () => {
        navigation.dispatch(data.action);
      },
    );
  });
}

export function useCreateFlowBackHandler(wizardStep: WizardStep): () => boolean {
  const navigation = useNavigation();
  const shouldPrevent = useCreateRouteFlowStore(selectShouldPreventRemove);

  return useCallback(() => {
    if (!shouldPrevent) {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }

      return false;
    }

    showCreateFlowExitAlert(
      navigation as { goBack: () => void; navigate: (name: string, params?: object) => void },
      wizardStep,
      () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        }

        useCreateRouteFlowStore.getState().completeFlow();
      },
    );

    return true;
  }, [shouldPrevent, navigation, wizardStep]);
}

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

type CreateFlowNavigation = {
  goBack: () => void;
  navigate: (name: string, params?: object) => void;
  canGoBack: () => boolean;
  dispatch: (action: unknown) => void;
};

const goToPreviousWizardStep = (
  navigation: CreateFlowNavigation,
  wizardStep: WizardStep,
): boolean => {
  if (wizardStep === 'category') {
    useCreateRouteFlowStore.getState().setWizardStep('stops');

    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }

    navigation.navigate('StopDetails');
    return true;
  }

  if (wizardStep === 'stops') {
    useCreateRouteFlowStore.getState().setWizardStep('photo');

    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }

    navigation.navigate('PhotoSelection');
    return true;
  }

  return false;
};

const exitCreateFlow = (navigation: CreateFlowNavigation): void => {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  useCreateRouteFlowStore.getState().completeFlow();
};

export function useCreateFlowPreventRemove(wizardStep: WizardStep): void {
  const navigation = useNavigation();
  const shouldPrevent = useCreateRouteFlowStore(selectShouldPreventRemove);
  const shouldPreventRemove = wizardStep === 'photo' && shouldPrevent;

  usePreventRemove(shouldPreventRemove, ({ data }) => {
    showCreateFlowExitAlert(
      navigation as CreateFlowNavigation,
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
    if (wizardStep === 'stops' || wizardStep === 'category') {
      return goToPreviousWizardStep(navigation as CreateFlowNavigation, wizardStep);
    }

    if (!shouldPrevent) {
      exitCreateFlow(navigation as CreateFlowNavigation);
      return true;
    }

    showCreateFlowExitAlert(
      navigation as CreateFlowNavigation,
      wizardStep,
      () => {
        exitCreateFlow(navigation as CreateFlowNavigation);
      },
    );

    return true;
  }, [shouldPrevent, navigation, wizardStep]);
}

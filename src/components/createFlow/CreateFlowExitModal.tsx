import React, { useEffect, useState } from 'react';
import AppModal, { type AppModalAction } from '../common/AppModal';
import { useCreateRouteFlowStore } from '../../store/createRouteFlowStore';
import { saveWizardDraft, clearWizardDraft } from '../../services/routeWizardDraftStorage';
import { showToast } from '../../utils/alert';
import type { WizardStep } from '../../types/createRouteFlowTypes';

type NavigationLike = {
  goBack: () => void;
  navigate: (name: string, params?: object) => void;
};

type ExitRequest = {
  navigation: NavigationLike;
  wizardStep: WizardStep;
  onDiscard?: () => void;
};

type Listener = (req: ExitRequest | null) => void;

let currentRequest: ExitRequest | null = null;
const listeners = new Set<Listener>();

function setRequest(req: ExitRequest | null) {
  currentRequest = req;
  listeners.forEach((l) => l(req));
}

export function requestCreateFlowExit(
  navigation: NavigationLike,
  wizardStep: WizardStep,
  onDiscard?: () => void,
): void {
  setRequest({ navigation, wizardStep, onDiscard });
}

export const CreateFlowExitModalHost: React.FC = () => {
  const [request, setRequestState] = useState<ExitRequest | null>(currentRequest);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  useEffect(() => {
    const listener: Listener = (req) => setRequestState(req);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const close = () => {
    if (isSaving || isDiscarding) return;
    setRequest(null);
  };

  const handleSaveDraft = async () => {
    if (!request || isSaving || isDiscarding) return;
    setIsSaving(true);

    try {
      const store = useCreateRouteFlowStore.getState();
      const snapshot = store.getSnapshotForDraft();

      if (!snapshot) {
        showToast('error', 'Kaydedilecek taslak bulunamadı');
        return;
      }

      const saved = await saveWizardDraft(snapshot, request.wizardStep);

      if (!saved) {
        showToast('error', 'Taslak kaydedilemedi');
        return;
      }

      store.completeFlow();
      showToast('success', 'Taslak kaydedildi', 'Kaydedildi');
      request.navigation.navigate('HomeStack', { screen: 'HomeMain' });
      setRequest(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!request || isSaving || isDiscarding) return;
    setIsDiscarding(true);

    try {
      await clearWizardDraft();
      useCreateRouteFlowStore.getState().completeFlow();
      const { onDiscard } = request;
      setRequest(null);
      onDiscard?.();
    } finally {
      setIsDiscarding(false);
    }
  };

  const isBusy = isSaving || isDiscarding;
  const visible = request !== null;

  const actions: AppModalAction[] = [
    {
      key: 'save',
      label: 'Taslağa kaydet',
      variant: 'primary',
      icon: 'content-save-outline',
      onPress: handleSaveDraft,
      loading: isSaving,
      disabled: isBusy,
    },
    {
      key: 'discard',
      label: 'Vazgeç ve çık',
      variant: 'destructive',
      onPress: handleDiscard,
      loading: isDiscarding,
      disabled: isBusy,
    },
    {
      key: 'cancel',
      label: 'Devam et',
      variant: 'ghost',
      onPress: close,
      disabled: isBusy,
    },
  ];

  return (
    <AppModal
      visible={visible}
      onClose={close}
      title="Çıkmak istediğine emin misin?"
      message="Yaptığın değişiklikler kaybolabilir. Dilersen taslak olarak kaydedip sonra devam edebilirsin."
      icon="exit-run"
      showCloseButton={false}
      dismissOnBackdrop={!isBusy}
      actions={actions}
    />
  );
};

export default CreateFlowExitModalHost;

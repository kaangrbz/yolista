import { Alert } from 'react-native';
import { useCreateRouteFlowStore } from '../store/createRouteFlowStore';
import { saveWizardDraft, clearWizardDraft } from '../services/routeWizardDraftStorage';
import { showToast } from './alert';
import type { WizardStep } from '../types/createRouteFlowTypes';

type NavigationLike = {
  goBack: () => void;
  navigate: (name: string, params?: object) => void;
};

export function showCreateFlowExitAlert(
  navigation: NavigationLike,
  wizardStep: WizardStep,
  onDiscard?: () => void,
): void {
  Alert.alert(
    'Çıkmak istediğine emin misin?',
    'Yaptığın değişiklikler kaybolabilir.',
    [
      { text: 'Devam et', style: 'cancel' },
      {
        text: 'Taslağa kaydet',
        onPress: async () => {
          const store = useCreateRouteFlowStore.getState();
          const snapshot = store.getSnapshotForDraft();

          if (!snapshot) {
            showToast('error', 'Kaydedilecek taslak bulunamadı');
            return;
          }

          const saved = await saveWizardDraft(snapshot, wizardStep);

          if (!saved) {
            showToast('error', 'Taslak kaydedilemedi');
            return;
          }

          store.completeFlow();
          showToast('success', 'Taslak kaydedildi', 'Kaydedildi');
          navigation.navigate('HomeStack', {
            screen: 'HomeMain',
          });
        },
      },
      {
        text: 'Vazgeç',
        style: 'destructive',
        onPress: async () => {
          await clearWizardDraft();
          useCreateRouteFlowStore.getState().completeFlow();
          onDiscard?.();
        },
      },
    ],
  );
}

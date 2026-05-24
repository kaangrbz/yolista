import { showToast } from './alert';
import { useRoutePublishStore } from '../store/routePublishStore';
import { clearWizardDraft } from '../services/routeWizardDraftStorage';
import { useCreateRouteFlowStore } from '../store/createRouteFlowStore';
import type { CreateFlowPhoto } from '../types/createRouteFlowTypes';
import type { RouteStop } from '../screens/CreateRoute/StopDetailsScreen';
import type { Category, City } from '../screens/CreateRoute/CategorySelectionScreen';

export type CreateFlowPublishPayload = {
  selectedPhotos: CreateFlowPhoto[];
  routeStops: RouteStop[];
  selectedCategory: Category | null;
  selectedCity: City | null;
};

export async function publishRouteFromCreateFlow(
  navigation: { navigate: (name: string, params?: object) => void },
  payload: CreateFlowPublishPayload,
): Promise<void> {
  try {
    const enqueue = useRoutePublishStore.getState().enqueue;
    const started = await enqueue(payload);

    if (!started) {
      return;
    }

    const jobId = useCreateRouteFlowStore.getState().jobId;

    if (jobId) {
      await clearWizardDraft(jobId);
    } else {
      await clearWizardDraft();
    }

    useCreateRouteFlowStore.getState().completeFlow();

    navigation.navigate('HomeStack', {
      screen: 'HomeMain',
      params: { scrollToTop: true },
    });
  } catch (error) {
    console.error('Route paylaşım kuyruğu hatası:', error);
    showToast('error', 'Rota paylaşımı başlatılamadı');
  }
}

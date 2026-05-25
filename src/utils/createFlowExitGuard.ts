import type { WizardStep } from '../types/createRouteFlowTypes';
import { requestCreateFlowExit } from '../components/createFlow/CreateFlowExitModal';

type NavigationLike = {
  goBack: () => void;
  navigate: (name: string, params?: object) => void;
};

export function showCreateFlowExitAlert(
  navigation: NavigationLike,
  wizardStep: WizardStep,
  onDiscard?: () => void,
): void {
  requestCreateFlowExit(navigation, wizardStep, onDiscard);
}

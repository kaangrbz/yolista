import React, { useEffect, useState } from 'react';
import AppModal, { type AppModalAction, type AppModalActionVariant } from './AppModal';

export interface ConfirmAction {
  key?: string;
  label: string;
  variant?: AppModalActionVariant;
  color?: string;
  icon?: string;
  /** Buton tıklanınca çağrılır. Modal otomatik kapanır. */
  onPress?: () => void | Promise<void>;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  actions: ConfirmAction[];
  /** 'auto' (default): 2 buton varsa yatay, aksi halde dikey. */
  actionsLayout?: 'auto' | 'horizontal' | 'vertical';
  dismissOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

type ConfirmState = { id: number; options: ConfirmOptions } | null;

type Listener = (state: ConfirmState) => void;

let currentState: ConfirmState = null;
const listeners = new Set<Listener>();
let idCounter = 0;

function setState(next: ConfirmState) {
  currentState = next;
  listeners.forEach((l) => l(next));
}

/**
 * Programatik onay/bilgi modalı.
 *
 * Örnek:
 * ```ts
 * showConfirm({
 *   title: 'Fotoğrafı Sil',
 *   message: 'Bu fotoğrafı silmek istediğinden emin misin?',
 *   icon: 'trash-can-outline',
 *   actions: [
 *     { key: 'cancel', label: 'İptal', variant: 'ghost' },
 *     { key: 'delete', label: 'Sil',   variant: 'destructive', onPress: () => remove() },
 *   ],
 * });
 * ```
 */
export function showConfirm(options: ConfirmOptions): void {
  idCounter += 1;
  setState({ id: idCounter, options });
}

export function hideConfirm(): void {
  setState(null);
}

export const ConfirmModalHost: React.FC = () => {
  const [state, setLocalState] = useState<ConfirmState>(currentState);

  useEffect(() => {
    const listener: Listener = (s) => setLocalState(s);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const close = () => setState(null);

  const options = state?.options;

  const wrappedActions: AppModalAction[] = (options?.actions ?? []).map(
    (action, idx) => ({
      key: action.key ?? `confirm-action-${idx}`,
      label: action.label,
      variant: action.variant,
      color: action.color,
      icon: action.icon,
      onPress: () => {
        close();
        // onPress'i kapatma animasyonundan sonra çağırmak yerine senkron tetikleyelim;
        // çoğu durumda navigation/async iş başlatıyor.
        try {
          const ret = action.onPress?.();
          if (ret && typeof (ret as Promise<unknown>).then === 'function') {
            (ret as Promise<unknown>).catch((err) => {
              console.error('ConfirmModal action error:', err);
            });
          }
        } catch (err) {
          console.error('ConfirmModal action error:', err);
        }
      },
    }),
  );

  return (
    <AppModal
      visible={state !== null}
      onClose={close}
      title={options?.title ?? ''}
      message={options?.message}
      icon={options?.icon}
      iconColor={options?.iconColor}
      actions={wrappedActions}
      actionsLayout={options?.actionsLayout ?? 'auto'}
      dismissOnBackdrop={options?.dismissOnBackdrop ?? true}
      showCloseButton={options?.showCloseButton ?? false}
    />
  );
};

export default ConfirmModalHost;

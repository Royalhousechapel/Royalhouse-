import { Alert as NativeAlert, Platform } from 'react-native';
import type { AlertButton, AlertOptions } from 'react-native';

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      NativeAlert.alert(title, message, buttons, options);
      return;
    }

    const text = [title, message].filter(Boolean).join('\n\n');
    if (!buttons || buttons.length < 2) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }

    const action = buttons.find((button) => button.style !== 'cancel');
    const cancel = buttons.find((button) => button.style === 'cancel');
    if (window.confirm(`${text}\n\n${action?.text || 'Continue'}?`)) {
      action?.onPress?.();
    } else {
      cancel?.onPress?.();
    }
  },
};

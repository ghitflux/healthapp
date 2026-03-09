import { Alert, Platform, ToastAndroid } from 'react-native';

function showNativeToast(title: string, message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(`${title}: ${message}`, ToastAndroid.SHORT);
    return;
  }

  Alert.alert(title, message);
}

export function showSuccessToast(message: string, title = 'Sucesso') {
  showNativeToast(title, message);
}

export function showErrorToast(message: string, title = 'Erro') {
  showNativeToast(title, message);
}

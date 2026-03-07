import { Alert, Platform } from 'react-native';

/**
 * Helper multiplataforma para confirmaciones.
 * En web, Alert.alert con botones falla silenciosamente — usamos window.confirm.
 * En iOS/Android, usamos el Alert nativo.
 */
export const confirmAction = (title, message, onConfirm) => {
    if (Platform.OS === 'web') {
        if (window.confirm(`${title}\n\n${message}`)) {
            onConfirm();
        }
    } else {
        Alert.alert(title, message, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', onPress: onConfirm }
        ]);
    }
};

/**
 * Confirmación destructiva (eliminar, etc.)
 */
export const confirmDestructive = (title, message, onConfirm) => {
    if (Platform.OS === 'web') {
        if (window.confirm(`⚠️ ${title}\n\n${message}`)) {
            onConfirm();
        }
    } else {
        Alert.alert(title, message, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: onConfirm }
        ]);
    }
};

/**
 * Alerta simple (solo OK) que funciona en web.
 */
export const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message || ''}`);
    } else {
        Alert.alert(title, message);
    }
};

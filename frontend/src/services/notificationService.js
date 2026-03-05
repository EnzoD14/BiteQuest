import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

// Configuración del handler: cómo mostrar la notificación cuando la app está en primer plano
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Solicita permisos de notificación.
 * En web no hace nada (expo-notifications no soporta push web).
 * @returns {Promise<boolean>} true si los permisos fueron concedidos
 */
export async function requestNotificationPermissions() {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

/**
 * Envía una notificación local inmediata.
 * Si no hay permisos, muestra un Alert explicativo.
 */
async function sendLocal(title, body, data = {}) {
    if (Platform.OS === 'web') {
        // En web usamos la Notifications API nativa del navegador
        if (!('Notification' in window)) {
            Alert.alert('No soportado', 'Tu navegador no soporta notificaciones push.');
            return;
        }

        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/favicon.ico',
            });
        } else {
            Alert.alert(
                'Permisos requeridos',
                'Habilitá las notificaciones para este sitio en la configuración de tu navegador.'
            );
        }
        return;
    }

    // Nativo (iOS / Android)
    const granted = await requestNotificationPermissions();
    if (!granted) {
        Alert.alert(
            'Permisos requeridos',
            'Habilitá las notificaciones para BiteQuest en la configuración de tu dispositivo.'
        );
        return;
    }

    await Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: true },
        trigger: null, // null = inmediata
    });
}

// ─── Notificaciones del prototipo ────────────────────────────────────────────

export const sendMealReminder = () =>
    sendLocal(
        '🍽️ ¡Hora de registrar tu comida!',
        'No olvides registrar lo que comiste para mantener tus calorías al día.',
        { type: 'MEAL_REMINDER' }
    );

export const sendChallengeUpdate = () =>
    sendLocal(
        '🏆 ¡Nuevo reto disponible!',
        'Tenés desafíos pendientes de hoy. ¡Completalos y sumá puntos!',
        { type: 'CHALLENGE_UPDATE' }
    );

export const sendWeeklyReport = () =>
    sendLocal(
        '📊 Tu reporte semanal está listo',
        'Esta semana completaste tus objetivos. ¡Mirá tu progreso en BiteQuest!',
        { type: 'WEEKLY_REPORT' }
    );

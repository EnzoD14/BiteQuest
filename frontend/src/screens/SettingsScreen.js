import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Switch, ActivityIndicator } from 'react-native';
import { confirmDestructive, showAlert } from '../utils/alerts';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';
import { sendMealReminder, sendChallengeUpdate, sendWeeklyReport, requestNotificationPermissions } from '../services/notificationService';

export default function SettingsScreen() {
    const { logout, user } = useContext(AuthContext);
    const navigation = useNavigation();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Arch #12: Preferencias persistidas en AsyncStorage
    const [mealReminders, setMealReminders] = useState(true);
    const [challengeUpdates, setChallengeUpdates] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    // Cargar preferencias guardadas al montar
    useEffect(() => {
        const loadPrefs = async () => {
            try {
                const saved = await AsyncStorage.getItem('@BiteQuest_Prefs');
                if (saved) {
                    const prefs = JSON.parse(saved);
                    setMealReminders(prefs.mealReminders ?? true);
                    setChallengeUpdates(prefs.challengeUpdates ?? true);
                    setWeeklyReport(prefs.weeklyReport ?? true);
                    setDarkMode(prefs.darkMode ?? false);
                }
            } catch (e) { /* ignorar error */ }
        };
        loadPrefs();
    }, []);

    // Guardar y aplicar al cambiar cualquier pref
    const updatePref = async (key, value, setter) => {
        setter(value);
        try {
            const saved = await AsyncStorage.getItem('@BiteQuest_Prefs');
            const current = saved ? JSON.parse(saved) : {};
            await AsyncStorage.setItem('@BiteQuest_Prefs', JSON.stringify({ ...current, [key]: value }));
        } catch (e) { /* ignorar error */ }
    };

    const fetchProfile = async () => {
        try {
            const response = await apiClient.get('/profile');
            setProfile(response.data);
        } catch (error) {
            console.error("Error fetching profile", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
            // Pedir permisos de notificación cuando el usuario abre ajustes
            requestNotificationPermissions();
        }, [])
    );

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const { email, name: userName } = user || {};
    const { dailyCaloricTarget, goal, weight } = profile || {};
    const proteinTarget = weight ? (weight * 1.6).toFixed(0) : 100;

    const translateGoal = (goalStr) => {
        if (goalStr === 'lose_weight') return 'Pérdida de peso';
        if (goalStr === 'gain_muscle') return 'Aumentar masa muscular';
        return 'Mantener peso';
    };

    return (
        <SafeAreaView style={[styles.safeArea, Platform.OS === 'web' && { height: '100vh' }]}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                <Text style={styles.mainTitle}>Ajustes</Text>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-outline" size={20} color={theme.colors.text} />
                        <Text style={styles.cardTitle}>Perfil</Text>
                    </View>

                    <View style={styles.profileRow}>
                        <View>
                            <Text style={styles.userName}>{userName || 'Usuario'}</Text>
                            <Text style={styles.userEmail}>{email || 'demo@bitequest.app'}</Text>
                        </View>
                        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('ProfileSetup')}>
                            <Text style={styles.editButtonText}>Editar</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Objetivo</Text>
                        <Text style={styles.infoValue}>{translateGoal(goal)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Calorias diarias</Text>
                        <Text style={styles.infoValue}>{dailyCaloricTarget ? Math.round(dailyCaloricTarget) : 2200} kcal</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Proteina diaria</Text>
                        <Text style={styles.infoValue}>{proteinTarget}g</Text>
                    </View>

                    <TouchableOpacity style={styles.recalcButton} onPress={() => navigation.navigate('ProfileSetup')}>
                        <Ionicons name="aperture-outline" size={16} color={theme.colors.textLight} style={{ marginRight: 8 }} />
                        <Text style={styles.recalcButtonText}>Recalcular objetivos</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
                        <Text style={styles.cardTitle}>Notificaciones</Text>
                    </View>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Recordatorios de comida</Text>
                        <View style={styles.toggleGroup}>
                            {mealReminders && (
                                <TouchableOpacity style={styles.testBtn} onPress={sendMealReminder}>
                                    <Text style={styles.testBtnText}>Probar →</Text>
                                </TouchableOpacity>
                            )}
                            <Switch
                                value={mealReminders}
                                onValueChange={v => updatePref('mealReminders', v, setMealReminders)}
                                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                thumbColor={theme.colors.surface}
                            />
                        </View>
                    </View>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Actualizaciones de retos</Text>
                        <View style={styles.toggleGroup}>
                            {challengeUpdates && (
                                <TouchableOpacity style={styles.testBtn} onPress={sendChallengeUpdate}>
                                    <Text style={styles.testBtnText}>Probar →</Text>
                                </TouchableOpacity>
                            )}
                            <Switch
                                value={challengeUpdates}
                                onValueChange={v => updatePref('challengeUpdates', v, setChallengeUpdates)}
                                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                thumbColor={theme.colors.surface}
                            />
                        </View>
                    </View>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Reporte semanal</Text>
                        <View style={styles.toggleGroup}>
                            {weeklyReport && (
                                <TouchableOpacity style={styles.testBtn} onPress={sendWeeklyReport}>
                                    <Text style={styles.testBtnText}>Probar →</Text>
                                </TouchableOpacity>
                            )}
                            <Switch
                                value={weeklyReport}
                                onValueChange={v => updatePref('weeklyReport', v, setWeeklyReport)}
                                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                thumbColor={theme.colors.surface}
                            />
                        </View>
                    </View>
                </View>

                {/* Preferencias */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="globe-outline" size={20} color={theme.colors.text} />
                        <Text style={styles.cardTitle}>Preferencias</Text>
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.iconLabelRow}>
                            <Ionicons name="moon-outline" size={18} color={theme.colors.text} style={{ marginRight: 10 }} />
                            <Text style={styles.settingLabel}>Modo oscuro</Text>
                            {/* Mejora #12: etiqueta 'próximamente' en lugar de toggle sin efecto */}
                            <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 }}>
                                <Text style={{ fontSize: 10, color: theme.colors.primary, fontWeight: '600' }}>Próximamente</Text>
                            </View>
                        </View>
                        <Switch
                            value={false}
                            disabled={true}
                            trackColor={{ false: theme.colors.border, true: theme.colors.border }}
                            thumbColor={theme.colors.surface}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.iconLabelRow}>
                            <Ionicons name="scale-outline" size={18} color={theme.colors.text} style={{ marginRight: 10 }} />
                            <Text style={styles.settingLabel}>Sistema de unidades</Text>
                        </View>

                        {/* Mock Dropdown */}
                        <TouchableOpacity style={styles.dropdownMock}>
                            <Text style={styles.dropdownMockText}>Metrico</Text>
                            <Ionicons name="chevron-down" size={16} color={theme.colors.textLight} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={20} color={theme.colors.error} style={{ marginRight: 8 }} />
                    <Text style={styles.logoutButtonText}>Cerrar sesion</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteAccountButton} onPress={() => {
                    confirmDestructive(
                        'Eliminar cuenta',
                        '¿Estás seguro? Se eliminarán todos tus datos de forma permanente.',
                        () => {
                            confirmDestructive(
                                'Última confirmación',
                                'Esta acción no se puede deshacer. ¿Eliminar tu cuenta y todos los datos?',
                                async () => {
                                    try {
                                        await apiClient.delete('/auth/account');
                                        await logout();
                                    } catch (e) {
                                        showAlert('Error', 'No se pudo eliminar la cuenta');
                                    }
                                }
                            );
                        }
                    );
                }}>
                    <Ionicons name="warning-outline" size={18} color={theme.colors.error} style={{ marginRight: 8 }} />
                    <Text style={styles.deleteAccountText}>Eliminar cuenta</Text>
                </TouchableOpacity>

                {/* Mejora #12: Sección Acerca de */}
                <View style={[styles.card, { marginTop: 8 }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="information-circle-outline" size={20} color={theme.colors.text} />
                        <Text style={styles.cardTitle}>Acerca de BiteQuest</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Versión</Text>
                        <Text style={styles.infoValue}>1.0.0</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Plataforma</Text>
                        <Text style={styles.infoValue}>React Native + Expo</Text>
                    </View>
                    <View style={styles.divider} />
                    <Text style={{ fontSize: 12, color: theme.colors.textLight, lineHeight: 18, textAlign: 'center' }}>
                        BiteQuest es un asistente nutricional gamificado con fines educativos. No reemplaza el asesoramiento de un profesional de la salud.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1, padding: theme.spacing.lg },

    mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 24, marginTop: 10 },

    card: {
        backgroundColor: theme.colors.surface, padding: 24, borderRadius: theme.borderRadius.md,
        borderWidth: 1, borderColor: theme.colors.border, marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginLeft: 12 },

    profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    userName: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 },
    userEmail: { fontSize: 14, color: theme.colors.textLight },

    editButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.border },
    editButtonText: { fontSize: 14, fontWeight: '600', color: theme.colors.textLight },

    divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 24 },

    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    infoLabel: { fontSize: 15, color: theme.colors.textLight },
    infoValue: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },

    recalcButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, marginTop: 16 },
    recalcButtonText: { fontSize: 15, fontWeight: '600', color: theme.colors.textLight },

    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    settingLabel: { fontSize: 15, color: theme.colors.text, flex: 1 },

    toggleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    testBtn: {
        backgroundColor: theme.colors.secondary, paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: theme.borderRadius.sm
    },
    testBtnText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },

    iconLabelRow: { flexDirection: 'row', alignItems: 'center' },

    dropdownMock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, paddingVertical: 8, width: 120 },
    dropdownMockText: { fontSize: 14, color: theme.colors.text },

    logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: '#FFD6D6', marginTop: 10 },
    logoutButtonText: { color: theme.colors.error, fontSize: 16, fontWeight: 'bold' },

    deleteAccountButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, paddingVertical: 10 },
    deleteAccountText: { color: theme.colors.error, fontSize: 15, fontWeight: '500' }
});

import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, SafeAreaView, Animated, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';

export default function ChallengesScreen() {
    const { recordTelemetry } = useContext(AuthContext);
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastAnim = useRef(new Animated.Value(0)).current;

    const fetchChallenges = async () => {
        setError(false);
        try {
            const response = await apiClient.get('/challenges/daily');
            setChallenges(response.data);
        } catch (error) {
            console.error(error);
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchChallenges();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchChallenges();
    };

    const handleComplete = async (userChallenge) => {
        if (userChallenge.isCompleted) return;

        const title = userChallenge.challengeId?.title || 'Reto';
        const pts = userChallenge.challengeId?.rewardPoints || 0;

        const doComplete = async () => {
            try {
                await apiClient.patch(`/challenges/${userChallenge._id}/complete`);
                recordTelemetry('CHALLENGE_COMPLETE', 0, { challengeTitle: title });

                // Toast animado de celebración
                setToastMessage(`🎉 ¡+${pts} XP! Reto completado`);
                Animated.sequence([
                    Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.delay(2200),
                    Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true })
                ]).start(() => setToastMessage(''));
                fetchChallenges();
            } catch (error) {
                Alert.alert('Error', 'No se pudo completar el reto');
            }
        };

        // En web, Alert.alert con botones no funciona — usamos confirm()
        if (Platform.OS === 'web') {
            if (window.confirm(`¿Completaste "${title}"?\n+${pts} XP`)) {
                doComplete();
            }
        } else {
            Alert.alert('¿Completaste este reto?', `${title}\n+${pts} XP`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: '¡Sí, lo hice!', onPress: doComplete }
            ]);
        }
    };



    if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} style={styles.center} />;

    if (error) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.textLight} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginTop: 16, marginBottom: 8 }}>Error al cargar retos</Text>
                <Text style={{ fontSize: 14, color: theme.colors.textLight, textAlign: 'center', marginBottom: 24, paddingHorizontal: 24 }}>No se pudo conectar al servidor.</Text>
                <TouchableOpacity
                    style={{ backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: theme.borderRadius.md }}
                    onPress={() => { setLoading(true); fetchChallenges(); }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const validChallenges = challenges.filter(item => item && item.challengeId);
    const completedCount = validChallenges.filter(item => item.isCompleted).length;
    const totalCount = validChallenges.length;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Mejora #5: Toast de celebración */}
            {toastMessage !== '' && (
                <Animated.View style={[styles.toast, {
                    opacity: toastAnim,
                    transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
                }]}>
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </Animated.View>
            )}

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tus Logros</Text>
                {totalCount > 0 && (
                    <View style={styles.counterBadge}>
                        <Text style={styles.counterText}>{completedCount}/{totalCount}</Text>
                    </View>
                )}
            </View>

            <View style={styles.container}>
                <Text style={styles.title}>Retos Activos</Text>
                <Text style={styles.subtitle}>
                    {completedCount === totalCount && totalCount > 0
                        ? '¡Completaste todos los retos de hoy! 🏆'
                        : `${totalCount - completedCount} reto${totalCount - completedCount !== 1 ? 's' : ''} pendiente${totalCount - completedCount !== 1 ? 's' : ''} hoy.`
                    }
                </Text>

                <FlatList
                    data={validChallenges}
                    keyExtractor={item => item._id}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="trophy-outline" size={48} color={theme.colors.textLight} />
                            <Text style={styles.emptyTitle}>Sin retos por hoy</Text>
                            <Text style={styles.emptyText}>No hay retos disponibles. Pull para actualizar.</Text>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <View style={[styles.card, item.isCompleted && styles.cardCompleted]}>
                            <View style={styles.textContainer}>
                                <Text style={[styles.challengeTitle, item.isCompleted && styles.textCompleted]}>{item.challengeId?.title}</Text>
                                <Text style={styles.challengeDesc}>{item.challengeId?.description}</Text>
                                <Text style={styles.points}>+{item.challengeId?.rewardPoints} XP • Nivel {item.challengeId?.difficultyLevel}</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, item.isCompleted ? styles.buttonCompleted : null]}
                                onPress={() => handleComplete(item)}
                                disabled={item.isCompleted}
                            >
                                <Ionicons
                                    name={item.isCompleted ? "checkmark-circle" : "play-circle"}
                                    size={24}
                                    color={item.isCompleted ? theme.colors.primary : theme.colors.surface}
                                />
                                {!item.isCompleted && <Text style={styles.buttonText}>Empezar</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.primary },
    center: { flex: 1, justifyContent: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg, paddingVertical: 16,
        backgroundColor: theme.colors.primary
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.surface },
    counterBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)'
    },
    counterText: { color: theme.colors.surface, fontWeight: 'bold', fontSize: 13 },

    container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },

    title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: theme.colors.textLight, marginBottom: 24 },

    card: {
        backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.borderRadius.lg,
        marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    cardCompleted: { opacity: 0.8, backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },

    textContainer: { flex: 1, paddingRight: theme.spacing.md },
    challengeTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 },
    textCompleted: { textDecorationLine: 'line-through', color: theme.colors.textLight },
    challengeDesc: { fontSize: 12, color: theme.colors.textLight, marginBottom: 8 },
    points: { fontSize: 14, fontWeight: 'bold', color: theme.colors.primary },

    button: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.borderRadius.md, flexDirection: 'row', alignItems: 'center' },
    buttonCompleted: { backgroundColor: 'transparent', padding: 0 },
    buttonText: { color: theme.colors.surface, fontWeight: 'bold', fontSize: 12, marginLeft: 4 },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
    emptyTitle: { fontSize: 17, fontWeight: 'bold', color: theme.colors.text, marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 14, color: theme.colors.textLight, textAlign: 'center' },

    // Mejora #5: Toast animado
    toast: {
        position: 'absolute', top: 10, left: 20, right: 20, zIndex: 100,
        backgroundColor: theme.colors.primary, borderRadius: 12,
        paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5
    },
    toastText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});

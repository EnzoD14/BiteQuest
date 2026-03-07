import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { confirmDestructive, showAlert } from '../utils/alerts';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { theme } from '../theme';

export default function FoodHistoryScreen({ navigation }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const response = await apiClient.get('/logs');
            setLogs(response.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchLogs(); }, []));

    const handleDelete = (id, name) => {
        confirmDestructive('Eliminar registro', `¿Querés eliminar "${name}"?`, async () => {
            try {
                await apiClient.delete(`/logs/${id}`);
                fetchLogs();
            } catch (e) {
                showAlert('Error', 'No se pudo eliminar');
            }
        });
    };

    // Agrupar logs por día
    const grouped = logs.reduce((acc, log) => {
        const day = new Date(log.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!acc[day]) acc[day] = { logs: [], totalCals: 0 };
        acc[day].logs.push(log);
        acc[day].totalCals += log.calories;
        return acc;
    }, {});

    const sections = Object.entries(grouped).map(([day, data]) => ({
        day,
        totalCals: data.totalCals,
        logs: data.logs
    }));

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historial de Comidas</Text>
                <View style={{ width: 24 }} />
            </View>

            {sections.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="restaurant-outline" size={48} color={theme.colors.textLight} />
                    <Text style={styles.emptyTitle}>Sin registros</Text>
                    <Text style={styles.emptyText}>Aún no registraste ninguna comida.</Text>
                    <TouchableOpacity
                        style={styles.emptyBtn}
                        onPress={() => navigation.navigate('LogFood')}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.emptyBtnText}>Registrar mi primera comida</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={sections}
                    keyExtractor={(item) => item.day}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: section }) => (
                        <View style={styles.daySection}>
                            <View style={styles.dayHeader}>
                                <Text style={styles.dayTitle}>{section.day}</Text>
                                <Text style={styles.dayTotal}>{section.totalCals} kcal</Text>
                            </View>
                            {section.logs.map(log => (
                                <View key={log._id} style={styles.logItem}>
                                    <View style={styles.logLeft}>
                                        <Ionicons name="restaurant-outline" size={18} color={theme.colors.primary} />
                                        <View style={styles.logInfo}>
                                            <Text style={styles.logName}>{log.name}</Text>
                                            <Text style={styles.logMacros}>P: {log.protein}g • C: {log.carbs}g • G: {log.fats}g</Text>
                                        </View>
                                    </View>
                                    <View style={styles.logRight}>
                                        <Text style={styles.logCals}>{log.calories} kcal</Text>
                                        <TouchableOpacity onPress={() => handleDelete(log._id, log.name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                            <Ionicons name="trash-outline" size={15} color={theme.colors.textLight} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 17, fontWeight: 'bold', color: theme.colors.text, marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 14, color: theme.colors.textLight, textAlign: 'center' },

    daySection: { marginBottom: 20 },
    dayHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border
    },
    dayTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, textTransform: 'capitalize' },
    dayTotal: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },

    logItem: {
        backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.borderRadius.md,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8
    },
    logLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    logInfo: { marginLeft: 10 },
    logName: { fontSize: 14, fontWeight: 'bold', color: theme.colors.text, marginBottom: 2 },
    logMacros: { fontSize: 11, color: theme.colors.textLight },
    logRight: { alignItems: 'flex-end', gap: 4 },
    logCals: { fontSize: 14, fontWeight: 'bold', color: theme.colors.primary },

    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary,
        paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginTop: 20
    },
    emptyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});

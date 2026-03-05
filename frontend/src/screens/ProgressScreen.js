import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

const MACRO_TABS = ['Kcal', 'Prot', 'Carbs', 'Grasa'];

export default function ProgressScreen() {
    const [weeklyData, setWeeklyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [error, setError] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0); // Mejora #7: 0 = semana actual, 1 = semana anterior, etc.

    const fetchWeekly = async (offset = weekOffset) => {
        setError(false);
        setLoading(true);
        try {
            // Mejora #7: Calcular rango de fechas según el offset de semana
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - offset * 7);
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);

            const from = startDate.toISOString().split('T')[0];
            const to = endDate.toISOString().split('T')[0];

            const response = await apiClient.get(`/dashboard/weekly?from=${from}&to=${to}`);
            setWeeklyData(response.data);
        } catch (error) {
            console.error(error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchWeekly(weekOffset);
        }, [weekOffset])
    );

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: theme.colors.background }}>
                <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.textLight} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginTop: 16, marginBottom: 8 }}>Error al cargar progreso</Text>
                <Text style={{ fontSize: 14, color: theme.colors.textLight, textAlign: 'center', marginBottom: 24 }}>No se pudo conectar al servidor. Verific\u00e1 tu conexi\u00f3n.</Text>
                <TouchableOpacity
                    style={{ backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: theme.borderRadius.md }}
                    onPress={() => { setLoading(true); fetchWeekly(); }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const days = weeklyData?.days || [];
    const targetCalories = weeklyData?.targetCalories || 2000;
    const proteinTarget = weeklyData?.proteinTarget || 100;
    const carbsTarget = weeklyData?.carbsTarget || 250;
    const fatsTarget = weeklyData?.fatsTarget || 65;

    // Calcular promedios de la semana
    const avgCalories = days.length ? days.reduce((a, d) => a + d.calories, 0) / days.length : 0;
    const avgProtein = days.length ? days.reduce((a, d) => a + d.protein, 0) / days.length : 0;
    const avgCarbs = days.length ? days.reduce((a, d) => a + d.carbs, 0) / days.length : 0;
    const avgFats = days.length ? days.reduce((a, d) => a + d.fats, 0) / days.length : 0;

    const calsPercAvg = Math.min((avgCalories / targetCalories) * 100, 100);
    const protPercAvg = Math.min((avgProtein / proteinTarget) * 100, 100);
    const carbsPercAvg = Math.min((avgCarbs / carbsTarget) * 100, 100);
    const fatsPercAvg = Math.min((avgFats / fatsTarget) * 100, 100);

    // Datos del gráfico según tab activo
    const getBarValue = (day) => {
        switch (activeTab) {
            case 1: return { value: day.protein, max: proteinTarget };
            case 2: return { value: day.carbs, max: carbsTarget };
            case 3: return { value: day.fats, max: fatsTarget };
            default: return { value: day.calories, max: targetCalories };
        }
    };

    // Mejora #7: Alturas en píxeles absolutos para compatibilidad con React Native nativo
    const BAR_MAX_HEIGHT = 120;
    const maxBarValue = Math.max(...days.map(d => getBarValue(d).value), 1);

    return (
        <SafeAreaView style={[styles.safeArea, Platform.OS === 'web' && { height: '100vh' }]}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                <View style={styles.headerRow}>
                    <Text style={styles.mainTitle}>Progreso semanal</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* Mejora #7: Navegación entre semanas */}
                        <TouchableOpacity
                            onPress={() => setWeekOffset(o => o + 1)}
                            style={styles.weekNavBtn}
                        >
                            <Ionicons name="chevron-back" size={18} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <View style={styles.dateBadge}>
                            <Ionicons name="calendar-outline" size={14} color={theme.colors.textLight} />
                            <Text style={styles.dateText}>
                                {weekOffset === 0 ? 'Esta semana' : `Hace ${weekOffset} sem.`}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setWeekOffset(o => Math.max(0, o - 1))}
                            style={[styles.weekNavBtn, weekOffset === 0 && styles.weekNavBtnDisabled]}
                            disabled={weekOffset === 0}
                        >
                            <Ionicons name="chevron-forward" size={18} color={weekOffset === 0 ? theme.colors.textLight : theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Grid Promedios */}
                <View style={styles.gridContainer}>
                    <View style={styles.macroCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Calorias promedio</Text>
                        </View>
                        <Text style={styles.cardValue}>{avgCalories.toFixed(0)} <Text style={styles.cardUnit}>kcal</Text></Text>
                        <Text style={styles.cardSubtitle}>{calsPercAvg.toFixed(0)}% de tu meta</Text>
                    </View>

                    <View style={styles.macroCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Proteina promedio</Text>
                        </View>
                        <Text style={styles.cardValue}>{avgProtein.toFixed(0)} <Text style={styles.cardUnit}>g</Text></Text>
                        <Text style={styles.cardSubtitle}>{protPercAvg.toFixed(0)}% de tu meta</Text>
                    </View>

                    <View style={styles.macroCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Carbohidratos promedio</Text>
                        </View>
                        <Text style={styles.cardValue}>{avgCarbs.toFixed(0)} <Text style={styles.cardUnit}>g</Text></Text>
                        <Text style={styles.cardSubtitle}>{carbsPercAvg.toFixed(0)}% de tu meta</Text>
                    </View>

                    <View style={styles.macroCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Grasas promedio</Text>
                        </View>
                        <Text style={styles.cardValue}>{avgFats.toFixed(0)} <Text style={styles.cardUnit}>g</Text></Text>
                        <Text style={styles.cardSubtitle}>{fatsPercAvg.toFixed(0)}% de tu meta</Text>
                    </View>
                </View>

                {/* Gráfico semanal con datos reales */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Historial semanal</Text>

                    <View style={styles.tabContainer}>
                        {MACRO_TABS.map((tab, i) => (
                            <TouchableOpacity
                                key={tab}
                                style={i === activeTab ? styles.tabActive : styles.tabInactive}
                                onPress={() => setActiveTab(i)}
                            >
                                <Text style={i === activeTab ? styles.tabTextActive : styles.tabTextInactive}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Bar chart real */}
                    <View style={styles.barChartContainer}>
                        {days.map((day) => {
                            const { value, max } = getBarValue(day);
                            // Mejora #7: altura absoluta en px, no porcentaje
                            const barHeight = maxBarValue > 0 ? Math.max((value / maxBarValue) * BAR_MAX_HEIGHT, value > 0 ? 4 : 0) : 0;
                            const isOverTarget = value > max;
                            return (
                                <View key={day.date} style={styles.barColumn}>
                                    <Text style={styles.barValue}>{value > 0 ? Math.round(value) : ''}</Text>
                                    <View style={[styles.barBackground, { height: BAR_MAX_HEIGHT }]}>
                                        <View style={[styles.barFill, { height: barHeight, backgroundColor: isOverTarget ? theme.colors.error || '#E57373' : theme.colors.primary }]} />
                                    </View>
                                    <Text style={styles.barLabel}>{day.label}</Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                        <Text style={styles.legendText}>Consumido</Text>
                        <View style={[styles.legendDot, { backgroundColor: theme.colors.error || '#E57373', marginLeft: 12 }]} />
                        <Text style={styles.legendText}>Supera meta</Text>
                    </View>
                </View>

                {/* Desglose Diario — datos reales */}
                <Text style={styles.sectionTitle}>Desglose diario</Text>

                {[...days].reverse().map((day) => {
                    const dayPercent = Math.min((day.calories / targetCalories) * 100, 100);
                    return (
                        <View key={day.date} style={styles.dailyCard}>
                            <View style={styles.dailyHeader}>
                                <Text style={styles.dailyDate}>{day.label} <Text style={{ fontSize: 12, color: theme.colors.textLight }}>{day.date}</Text></Text>
                                <Text style={styles.dailyTotal}>{day.calories.toFixed(0)} <Text style={styles.dailyTarget}>/ {targetCalories} kcal</Text></Text>
                            </View>
                            <View style={styles.dailyProgressBar}>
                                <View style={[styles.dailyProgressFill, { width: `${dayPercent}%` }]} />
                            </View>
                            <View style={styles.dailyMacros}>
                                <Text style={styles.dailyMacroText}>P: {day.protein.toFixed(0)}g</Text>
                                <Text style={styles.dailyMacroText}>C: {day.carbs.toFixed(0)}g</Text>
                                <Text style={styles.dailyMacroText}>G: {day.fats.toFixed(0)}g</Text>
                                <Text style={styles.dailyMacroPercent}>{dayPercent.toFixed(0)}%</Text>
                            </View>
                        </View>
                    );
                })}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1, padding: theme.spacing.lg },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
    mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
    dateBadge: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 13, color: theme.colors.textLight, marginLeft: 4 },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
    macroCard: {
        width: '48%', backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.borderRadius.md,
        borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 13, color: theme.colors.textLight },
    cardValue: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 },
    cardUnit: { fontSize: 14, fontWeight: 'normal', color: theme.colors.textLight },
    cardSubtitle: { fontSize: 12, color: theme.colors.textLight },

    chartCard: {
        backgroundColor: theme.colors.surface, padding: 24, borderRadius: theme.borderRadius.md,
        borderWidth: 1, borderColor: theme.colors.border, marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1
    },
    chartTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 24 },

    tabContainer: { flexDirection: 'row', backgroundColor: '#F0F2EB', borderRadius: theme.borderRadius.md, padding: 4, marginBottom: 24 },
    tabActive: { flex: 1, backgroundColor: theme.colors.surface, paddingVertical: 8, borderRadius: theme.borderRadius.sm, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    tabInactive: { flex: 1, paddingVertical: 8, alignItems: 'center' },
    tabTextActive: { fontSize: 14, fontWeight: 'bold', color: theme.colors.text },
    tabTextInactive: { fontSize: 14, fontWeight: '600', color: theme.colors.textLight },

    // Bar chart styles
    barChartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, marginBottom: 8 },
    barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    barValue: { fontSize: 9, color: theme.colors.textLight, marginBottom: 2 },
    barBackground: { width: '60%', height: 130, backgroundColor: '#F0F2EB', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
    barFill: { width: '100%', borderRadius: 4, minHeight: 2 },
    barLabel: { fontSize: 11, color: theme.colors.textLight, marginTop: 6 },

    legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
    legendText: { fontSize: 12, color: theme.colors.textLight },

    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },

    dailyCard: {
        backgroundColor: theme.colors.surface, padding: 20, borderRadius: theme.borderRadius.md,
        borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1
    },
    dailyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    dailyDate: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
    dailyTotal: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
    dailyTarget: { fontSize: 14, fontWeight: 'normal', color: theme.colors.textLight },

    dailyProgressBar: { height: 8, backgroundColor: '#F0F2EB', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
    dailyProgressFill: { height: '100%', backgroundColor: theme.colors.secondary },

    dailyMacros: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dailyMacroText: { fontSize: 13, color: theme.colors.textLight },
    dailyMacroPercent: { fontSize: 13, fontWeight: 'bold', color: theme.colors.textLight },

    // Mejora #7: Botones de navegación semanal
    weekNavBtn: {
        backgroundColor: theme.colors.secondary, width: 28, height: 28, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center'
    },
    weekNavBtnDisabled: { opacity: 0.4 },
});

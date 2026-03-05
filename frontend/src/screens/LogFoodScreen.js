import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View, Text, StyleSheet, SectionList, FlatList, TouchableOpacity, Alert, ActivityIndicator,
    SafeAreaView, Animated, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';

const PORTION_OPTIONS = [
    { label: '½ porción', multiplier: 0.5 },
    { label: '1 porción', multiplier: 1 },
    { label: '1½ porciones', multiplier: 1.5 },
    { label: '2 porciones', multiplier: 2 },
    { label: '3 porciones', multiplier: 3 },
];

export default function LogFoodScreen({ navigation }) {
    const { recordTelemetry } = useContext(AuthContext);
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState(null);
    const [loggingId, setLoggingId] = useState(null);
    const toastAnim = useRef(new Animated.Value(0)).current;

    // Mejora #1: Buscador en tiempo real
    const [query, setQuery] = useState('');

    // Mejora #5: Modal de cantidad
    const [selectedFood, setSelectedFood] = useState(null);
    const [showQuantityModal, setShowQuantityModal] = useState(false);

    const categoryOrder = ['desayuno', 'almuerzo', 'merienda', 'cena', 'postre', 'suplemento', 'frutas'];

    useEffect(() => { fetchFoods(); }, []);

    const fetchFoods = async () => {
        try {
            const response = await apiClient.get('/foods');
            setFoods(response.data);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los alimentos.');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message) => {
        setToastMessage(message);
        Animated.sequence([
            Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.delay(1800),
            Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => {
            setToastMessage(null);
            navigation.navigate('Dashboard');
        });
    };

    // Mejora #5: Al tocar alimento, abrir modal de cantidad primero
    const handleFoodPress = (food) => {
        if (loggingId) return;
        setSelectedFood(food);
        setShowQuantityModal(true);
    };

    const handleLogFood = async (food, multiplier = 1) => {
        setShowQuantityModal(false);
        if (loggingId) return;
        setLoggingId(food._id);
        const startTime = Date.now();
        try {
            const adjustedCalories = Math.round(food.calories * multiplier);
            const adjustedProtein = Math.round(food.protein * multiplier * 10) / 10;
            const adjustedCarbs = Math.round(food.carbs * multiplier * 10) / 10;
            const adjustedFats = Math.round(food.fats * multiplier * 10) / 10;

            await apiClient.post('/logs', {
                foodId: food._id,
                name: multiplier !== 1 ? `${food.name} (×${multiplier})` : food.name,
                calories: adjustedCalories,
                protein: adjustedProtein,
                carbs: adjustedCarbs,
                fats: adjustedFats
            });

            const duration = Date.now() - startTime;
            recordTelemetry('FOOD_LOG', duration, { calories: adjustedCalories });
            showToast(`✓ ${food.name} · ${adjustedCalories} kcal añadidas`);
        } catch (error) {
            Alert.alert('Error', 'Hubo un error al registrar el alimento');
        } finally {
            setLoggingId(null);
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color={theme.colors.primary} style={styles.center} />;
    }

    // Mejora #1: Lista filtrada cuando hay búsqueda activa
    const filteredFoods = query.trim()
        ? foods.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
        : null;

    const sections = categoryOrder
        .map(cat => ({
            title: cat.charAt(0).toUpperCase() + cat.slice(1),
            data: foods.filter(f => f.category.toLowerCase() === cat)
        }))
        .filter(s => s.data.length > 0);

    const renderFoodCard = (item) => {
        const isLogging = loggingId === item._id;
        return (
            <TouchableOpacity
                style={[styles.card, isLogging && styles.cardLogging]}
                onPress={() => handleFoodPress(item)}
                disabled={!!loggingId}
                activeOpacity={0.7}
            >
                <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                        {isLogging
                            ? <ActivityIndicator size="small" color={theme.colors.primary} />
                            : <Ionicons name="restaurant-outline" size={20} color={theme.colors.primary} />
                        }
                    </View>
                    <View>
                        <Text style={styles.foodName}>{item.name}</Text>
                        <View style={styles.foodSpecs}>
                            <Text style={styles.foodCategory}>{item.category.toUpperCase()}</Text>
                            <Text style={styles.foodMacros}> · P:{item.protein}g C:{item.carbs}g G:{item.fats}g</Text>
                        </View>
                    </View>
                </View>
                <View style={[styles.addButton, isLogging && styles.addButtonLogging]}>
                    <Text style={styles.addButtonText}>+{item.calories} kcal</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Toast de confirmación animado */}
            {toastMessage && (
                <Animated.View style={[styles.toast, {
                    opacity: toastAnim,
                    transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
                }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </Animated.View>
            )}

            {/* Panel de cantidad — posicionado dentro del contenedor de la app */}
            {showQuantityModal && selectedFood && (
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowQuantityModal(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={() => { }}>
                        <Text style={styles.modalTitle}>{selectedFood.name}</Text>
                        <Text style={styles.modalSubtitle}>¿Cuántas porciones?</Text>
                        {PORTION_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.multiplier}
                                style={styles.portionRow}
                                onPress={() => handleLogFood(selectedFood, opt.multiplier)}
                            >
                                <Text style={styles.portionLabel}>{opt.label}</Text>
                                <Text style={styles.portionCals}>
                                    {Math.round((selectedFood.calories || 0) * opt.multiplier)} kcal
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowQuantityModal(false)}>
                            <Text style={styles.modalCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            )}

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Registrar Comida</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.container}>
                <Text style={styles.title}>Catálogo de Alimentos</Text>
                <Text style={styles.subtitle}>Tocá un alimento para elegir la cantidad · 1-Tap para registrar</Text>

                {/* Buscador — Mejora #1 */}
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color={theme.colors.textLight} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar alimento..."
                        placeholderTextColor={theme.colors.textLight}
                        value={query}
                        onChangeText={setQuery}
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={18} color={theme.colors.textLight} />
                        </TouchableOpacity>
                    )}
                </View>

                {filteredFoods ? (
                    // Búsqueda activa → lista plana
                    filteredFoods.length > 0 ? (
                        <FlatList
                            data={filteredFoods}
                            keyExtractor={item => item._id}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => renderFoodCard(item)}
                        />
                    ) : (
                        <View style={styles.emptySearch}>
                            <Ionicons name="search-outline" size={40} color={theme.colors.textLight} />
                            <Text style={styles.emptySearchText}>Sin resultados para "{query}"</Text>
                        </View>
                    )
                ) : (
                    // Sin búsqueda → lista por categorías
                    <SectionList
                        sections={sections}
                        keyExtractor={item => item._id}
                        showsVerticalScrollIndicator={false}
                        stickySectionHeadersEnabled={false}
                        renderSectionHeader={({ section: { title } }) => (
                            <Text style={styles.sectionHeader}>{title}</Text>
                        )}
                        renderItem={({ item }) => renderFoodCard(item)}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.surface },
    center: { flex: 1, justifyContent: 'center' },

    toast: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: theme.colors.primary,
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    },
    toastText: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },

    container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: theme.colors.textLight, marginBottom: 16 },

    // Buscador
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
        paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
        borderWidth: 1, borderColor: theme.colors.border
    },
    searchInput: { flex: 1, fontSize: 15, color: theme.colors.text },

    emptySearch: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptySearchText: { fontSize: 15, color: theme.colors.textLight, marginTop: 12 },

    sectionHeader: {
        fontSize: 18, fontWeight: 'bold', color: theme.colors.primary,
        marginTop: 16, marginBottom: 12, paddingHorizontal: 4
    },

    card: {
        backgroundColor: theme.colors.surface, flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: theme.spacing.md, borderRadius: theme.borderRadius.md,
        marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, borderWidth: 1, borderColor: theme.colors.border
    },
    cardLogging: { opacity: 0.7 },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconContainer: {
        backgroundColor: theme.colors.secondary, width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center', marginRight: 12
    },
    foodName: { fontSize: 15, fontWeight: 'bold', color: theme.colors.text },
    foodSpecs: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    foodCategory: { fontSize: 11, color: theme.colors.textLight, fontWeight: '500' },
    foodMacros: { fontSize: 11, color: theme.colors.textLight },

    addButton: {
        backgroundColor: theme.colors.secondary, paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: theme.borderRadius.md
    },
    addButtonLogging: { backgroundColor: theme.colors.border },
    addButtonText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 13 },

    // Overlay absoluto dentro del SafeAreaView (mismo ancho que la app)
    modalOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', zIndex: 50
    },
    modalCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 36
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 },
    modalSubtitle: { fontSize: 14, color: theme.colors.textLight, marginBottom: 20 },
    portionRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border
    },
    portionLabel: { fontSize: 16, color: theme.colors.text },
    portionCals: { fontSize: 15, color: theme.colors.primary, fontWeight: '600' },
    modalCancel: { marginTop: 16, alignItems: 'center', paddingVertical: 12 },
    modalCancelText: { fontSize: 16, color: theme.colors.textLight },
});


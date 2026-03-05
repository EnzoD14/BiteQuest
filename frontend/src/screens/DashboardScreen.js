import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, SafeAreaView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';
import { theme } from '../theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// --- Sistema de tips diarios rotativos ---
const DAILY_TIPS = [
    // Hidratación
    { icon: 'water-outline', color: '#2196F3', category: 'Hidratación', title: 'Empezá el día con agua', text: 'Tomar un vaso de agua al despertar activa el metabolismo y mejora la concentración desde temprano.' },
    { icon: 'water-outline', color: '#2196F3', category: 'Hidratación', title: '2 litros diarios', text: 'Mantener una buena hidratación mejora el rendimiento físico, la piel y regula el apetito a lo largo del día.' },
    { icon: 'water-outline', color: '#2196F3', category: 'Hidratación', title: 'Agua antes de comer', text: 'Tomar 250ml de agua 15 minutos antes de cada comida ayuda a controlar las porciones y mejorar la digestión.' },
    { icon: 'water-outline', color: '#2196F3', category: 'Hidratación', title: 'Evitá bebidas azucaradas', text: 'Reemplazar una bebida azucarada por agua o infusión sin azúcar puede eliminar más de 150 kcal extra por día.' },
    // Proteínas
    { icon: 'barbell-outline', color: '#4CAF50', category: 'Proteínas', title: 'Proteína en el desayuno', text: 'Agregar huevos o yogur griego al desayuno te ayudará a mantener la energía y reducir el hambre hasta el mediodía.' },
    { icon: 'barbell-outline', color: '#4CAF50', category: 'Proteínas', title: 'Distribuí la proteína', text: 'Consumir proteína repartida en cada comida (30-40g por plato) maximiza la síntesis muscular durante el día.' },
    { icon: 'barbell-outline', color: '#4CAF50', category: 'Proteínas', title: 'Legumbres como proteína vegetal', text: 'Las lentejas, garbanzos y porotos son excelentes fuentes de proteína y fibra, ideales si comés poca carne.' },
    { icon: 'barbell-outline', color: '#4CAF50', category: 'Proteínas', title: 'Proteína post-entrenamiento', text: 'Consumir proteína en los 30-45 minutos después de entrenar acelera la recuperación muscular y reduce el dolor.' },
    // Carbohidratos
    { icon: 'leaf-outline', color: '#FF9800', category: 'Carbohidratos', title: 'Preferí carbos complejos', text: 'El arroz integral, avena y batata liberan energía lentamente, manteniendo estables los niveles de azúcar en sangre.' },
    { icon: 'leaf-outline', color: '#FF9800', category: 'Carbohidratos', title: 'El horario importa', text: 'Consumir más carbohidratos en el desayuno y almuerzo, y reducirlos en la cena, favorece la quema de grasa nocturna.' },
    { icon: 'leaf-outline', color: '#FF9800', category: 'Carbohidratos', title: 'Fibra para la saciedad', text: 'El pan integral, las verduras y las frutas enteras aportan fibra que genera mayor sensación de saciedad.' },
    { icon: 'leaf-outline', color: '#FF9800', category: 'Carbohidratos', title: 'Azúcar oculta', text: 'Muchos productos "light" contienen más azúcar de lo esperado. Buscá menos de 5g de azúcar cada 100g en la etiqueta.' },
    // Grasas
    { icon: 'heart-outline', color: '#E91E63', category: 'Grasas', title: 'Grasas buenas en cada comida', text: 'El palta, los frutos secos y el aceite de oliva aportan grasas saludables que protegen el corazón y mejoran la saciedad.' },
    { icon: 'heart-outline', color: '#E91E63', category: 'Grasas', title: 'Omega-3 para el cerebro', text: 'El salmón, las sardinas y las semillas de chía son ricas en Omega-3, beneficioso para la memoria y el ánimo.' },
    { icon: 'heart-outline', color: '#E91E63', category: 'Grasas', title: 'Evitá las grasas trans', text: 'Las grasas trans en panaderías industriales aumentan el colesterol malo. Preferí siempre opciones naturales.' },
    // Hábitos
    { icon: 'time-outline', color: '#9C27B0', category: 'Hábitos', title: 'Comé despacio', text: 'El cerebro tarda 20 minutos en recibir la señal de saciedad. Comer más lento reduce la ingesta total sin esfuerzo.' },
    { icon: 'time-outline', color: '#9C27B0', category: 'Hábitos', title: 'Plato equilibrado', text: 'Un plato ideal tiene: ½ de verduras, ¼ de proteína y ¼ de carbohidratos. Simple y efectivo para cualquier comida.' },
    { icon: 'time-outline', color: '#9C27B0', category: 'Hábitos', title: 'No te saltés el almuerzo', text: 'Saltarse comidas aumenta el cortisol y hace que el cuerpo almacene más grasa. La regularidad de horarios es clave.' },
    { icon: 'time-outline', color: '#9C27B0', category: 'Hábitos', title: 'Cocinás más, comés mejor', text: 'Preparar tu propia comida te da control total sobre los ingredientes, reduciendo grasas y sales innecesarias.' },
    { icon: 'time-outline', color: '#9C27B0', category: 'Hábitos', title: 'Planificá tus comidas', text: 'Tener las comidas preparadas con anticipación reduce la probabilidad de elegir opciones poco saludables por urgencia.' },
    // Descanso
    { icon: 'moon-outline', color: '#607D8B', category: 'Descanso', title: 'El sueño regula el apetito', text: 'Dormir menos de 7 horas aumenta la hormona del hambre y reduce la saciedad. El sueño también es nutrición.' },
    { icon: 'moon-outline', color: '#607D8B', category: 'Descanso', title: 'Cena liviana', text: 'Una cena liviana 2-3 horas antes de dormir mejora la calidad del sueño y favorece la recuperación nocturna.' },
    { icon: 'moon-outline', color: '#607D8B', category: 'Descanso', title: 'Estrés y alimentación', text: 'El estrés crónico aumenta los antojos de azúcares y ultraprocesados. Una caminata corta puede reducirlo notablemente.' },
    { icon: 'moon-outline', color: '#607D8B', category: 'Descanso', title: 'Actividad física diaria', text: '30 minutos de caminata por día mejoran el metabolismo, el ánimo y la calidad del sueño, sin necesidad de ir al gym.' },
    // Energía y extras
    { icon: 'flash-outline', color: '#FF5722', category: 'Energía', title: 'Verduras de hoja verde', text: 'Las verduras de hoja verde son densas en vitaminas y minerales con muy pocas calorías. Son el alimento más eficiente.' },
    { icon: 'flash-outline', color: '#FF5722', category: 'Energía', title: 'Snacks inteligentes', text: 'Un puñado de nueces o una fruta entera sacian, aportan nutrientes y no generan picos de glucosa.' },
    { icon: 'flash-outline', color: '#FF5722', category: 'Energía', title: 'Comé sin pantallas', text: 'Comer frente al teléfono o TV puede aumentar la ingesta hasta un 25% porque el cerebro no registra bien la comida.' },
    { icon: 'flash-outline', color: '#FF5722', category: 'Energía', title: 'Colores en el plato', text: 'Cuantos más colores de verduras y frutas haya en tu plato, mayor variedad de antioxidantes y vitaminas estarás tomando.' },
    { icon: 'flash-outline', color: '#FF5722', category: 'Energía', title: 'El café con moderación', text: 'Hasta 3 cafés por día pueden mejorar el rendimiento. Pero evitá la cafeína después de las 15hs para no afectar el sueño.' },
    // Ejercicio
    { icon: 'fitness-outline', color: '#00BCD4', category: 'Ejercicio', title: 'Combustible pre-entreno', text: 'Una banana o tostada con mantequilla de maní 30 minutos antes del ejercicio mejora el rendimiento y evita el mareo.' },
    { icon: 'fitness-outline', color: '#00BCD4', category: 'Ejercicio', title: 'Estirá después de entrenar', text: 'Dedicar 5-10 minutos a estirar después del ejercicio reduce el riesgo de lesiones y acorta el tiempo de recuperación.' },
    { icon: 'fitness-outline', color: '#00BCD4', category: 'Ejercicio', title: 'Variá tu rutina', text: 'Cambiar el tipo de ejercicio cada 4-6 semanas evita el estancamiento y mantiene la motivación alta a largo plazo.' },
];

// Seed determinista: misma tip durante todo el día, diferente cada día del año
const getDailyTip = () => {
    const d = new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return DAILY_TIPS[seed % DAILY_TIPS.length];
};

export default function DashboardScreen({ navigation }) {
    const { logout, user } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    const fetchDashboard = async () => {
        setError(false);
        try {
            const response = await apiClient.get('/dashboard');
            setData(response.data);
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
            fetchDashboard();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    // Arch #11: Pantalla de error amigable con reintento
    if (error) {
        return (
            <View style={styles.center}>
                <Ionicons name="wifi-outline" size={48} color={theme.colors.textLight} />
                <Text style={styles.errorTitle}>Error al cargar datos</Text>
                <Text style={styles.errorText}>Verific\u00e1 tu conexi\u00f3n a internet o que el servidor est\u00e9 encendido.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchDashboard(); }}>
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const progressPercent = data ? Math.min((data.caloriesConsumed / data.targetCalories) * 100, 100) : 0;
    const proteinTarget = data?.proteinTarget || 100;
    const carbsTarget = data?.carbsTarget || 250;
    const fatsTarget = data?.fatsTarget || 65;
    const proteinPercent = data ? Math.min((data.proteinConsumed / proteinTarget) * 100, 100) : 0;
    const carbsPercent = data ? Math.min((data.carbsConsumed / carbsTarget) * 100, 100) : 0;
    const fatsPercent = data ? Math.min((data.fatsConsumed / fatsTarget) * 100, 100) : 0;

    const hasMeals = data && data.recentLogs && data.recentLogs.length > 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Top Bar Header */}
            <View style={styles.topBar}>
                <View style={styles.logoRow}>
                    <View style={styles.logoIcon}>
                        <Ionicons name="restaurant-outline" size={20} color={theme.colors.surface} />
                    </View>
                    <Text style={styles.logoText}>BiteQuest</Text>
                </View>
                <TouchableOpacity
                    onPress={() => Alert.alert(
                        '\u00bfCerrar sesi\u00f3n?',
                        '\u00bfEst\u00e1s seguro que quer\u00e9s salir?',
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Salir', style: 'destructive', onPress: logout }
                        ]
                    )}
                    style={styles.avatarCircle}
                >
                    <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || 'U'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.greeting}>{(() => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches'; })()}</Text>
                <Text style={styles.mainTitle}>Hola, {user?.name || user?.email?.split('@')[0]} 👋</Text>
                <Text style={styles.subtitle}>Aquí está tu resumen nutricional de hoy.</Text>

                <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('LogFood')}>
                    <Ionicons name="add" size={20} color={theme.colors.surface} style={{ marginRight: 8 }} />
                    <Text style={styles.mainButtonText}>Registrar comida</Text>
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Hoy</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeMore}>Ver mas {'>'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Macros Grid */}
                <View style={styles.gridContainer}>
                    {/* Calories */}
                    <View style={styles.macroCard}>
                        <View style={styles.macroHeader}>
                            <Text style={styles.macroTitle}>CALORIAS</Text>
                            <Ionicons name="flame-outline" size={16} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.macroValue}>{data?.caloriesConsumed} <Text style={styles.macroTarget}>/ {data?.targetCalories} kcal</Text></Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                        </View>
                    </View>

                    {/* Proteina */}
                    <View style={styles.macroCard}>
                        <View style={styles.macroHeader}>
                            <Text style={styles.macroTitle}>PROTEINA</Text>
                            <MaterialCommunityIcons name="food-drumstick-outline" size={16} color="#8D6E63" />
                        </View>
                        <Text style={styles.macroValue}>{data?.proteinConsumed?.toFixed(1) || 0} <Text style={styles.macroTarget}>/ {proteinTarget} g</Text></Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${proteinPercent}%` }]} />
                        </View>
                    </View>

                    {/* Carbs */}
                    <View style={styles.macroCard}>
                        <View style={styles.macroHeader}>
                            <Text style={styles.macroTitle}>CARBOHIDRATOS</Text>
                            <MaterialCommunityIcons name="barley" size={16} color="#795548" />
                        </View>
                        <Text style={styles.macroValue}>{data?.carbsConsumed?.toFixed(1) || 0} <Text style={styles.macroTarget}>/ {carbsTarget} g</Text></Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${carbsPercent}%` }]} />
                        </View>
                    </View>

                    {/* Fats */}
                    <View style={styles.macroCard}>
                        <View style={styles.macroHeader}>
                            <Text style={styles.macroTitle}>GRASAS</Text>
                            <Ionicons name="water-outline" size={16} color="#757575" />
                        </View>
                        <Text style={styles.macroValue}>{data?.fatsConsumed?.toFixed(1) || 0} <Text style={styles.macroTarget}>/ {fatsTarget} g</Text></Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${fatsPercent}%` }]} />
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tu progreso</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Progreso')}>
                        <Text style={styles.seeMore}>Ver mas {'>'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats: Puntos, Nivel, Racha */}
                <View style={styles.progressStatsContainer}>
                    <View style={styles.progressStatCard}>
                        <Text style={styles.progressStatValue}>{data?.points || 0}</Text>
                        <Text style={styles.progressStatLabel}>XP Total</Text>
                    </View>
                    <View style={styles.progressStatCard}>
                        <Text style={styles.progressStatValue}>Niv. {data?.level || 1}</Text>
                        <Text style={styles.progressStatLabel}>Nivel</Text>
                    </View>
                    <View style={styles.progressStatCard}>
                        <Text style={styles.progressStatValue}>{data?.streak || 0} 🔥</Text>
                        <Text style={styles.progressStatLabel}>Racha</Text>
                    </View>
                </View>

                {/* Barra de progreso al siguiente nivel */}
                {(() => {
                    const toNext = data?.pointsToNextLevel ?? 500;
                    const currentInLevel = 500 - toNext; // XP ganados dentro del nivel actual
                    const pct = Math.max(0, Math.min(100, (currentInLevel / 500) * 100));
                    return (
                        <View style={styles.levelProgressCard}>
                            <View style={styles.levelProgressHeader}>
                                <View style={styles.levelBadge}>
                                    <Ionicons name="star" size={14} color={theme.colors.primary} />
                                    <Text style={styles.levelBadgeText}>Nivel {data?.level || 1}</Text>
                                </View>
                                <Text style={styles.levelNextLabel}>Nivel {(data?.level || 1) + 1}</Text>
                            </View>
                            <View style={styles.levelBarBg}>
                                <View style={[styles.levelBarFill, { width: `${pct}%` }]} />
                            </View>
                            <View style={styles.levelProgressFooter}>
                                <Text style={styles.levelXpCurrent}>{currentInLevel} XP en este nivel</Text>
                                <Text style={styles.levelXpNeeded}>🏆 Faltan {toNext} XP</Text>
                            </View>
                        </View>
                    );
                })()}

                {/* Recomendación del día — cambia cada 24hs automáticamente */}
                {(() => {
                    const tip = getDailyTip();
                    return (
                        <View style={[styles.recommendationCard, { borderLeftColor: tip.color, borderLeftWidth: 4 }]}>
                            <View style={styles.recommendationHeader}>
                                <Ionicons name={tip.icon} size={20} color={tip.color} />
                                <View style={{ marginLeft: 8, flex: 1 }}>
                                    <Text style={[styles.recommendationCategory, { color: tip.color }]}>{tip.category.toUpperCase()}</Text>
                                    <Text style={styles.recommendationTitle}>{tip.title}</Text>
                                </View>
                            </View>
                            <Text style={styles.recommendationText}>{tip.text}</Text>
                        </View>
                    );
                })()}

                {/* Comidas de hoy panel */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Comidas de hoy</Text>
                    {data?.totalLogsToday > 5 && (
                        <TouchableOpacity onPress={() => navigation.navigate('LogFood')}>
                            <Text style={styles.seeMore}>Ver todas ({data.totalLogsToday}) →</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {hasMeals ? (
                    data.recentLogs.map((meal, index) => (
                        <View key={index} style={styles.mealItemCard}>
                            <View style={styles.mealItemLeft}>
                                <Ionicons name="restaurant-outline" size={20} color={theme.colors.primary} />
                                <View style={styles.mealItemInfo}>
                                    <Text style={styles.mealItemName}>{meal.name}</Text>
                                    <Text style={styles.mealItemMacros}>P: {meal.protein}g • C: {meal.carbs}g • G: {meal.fats}g</Text>
                                </View>
                            </View>
                            <Text style={styles.mealItemCals}>{meal.calories} kcal</Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.mealsCard}>
                        <Text style={styles.mealsEmptyText}>Aun no has registrado ninguna comida hoy.</Text>
                        <TouchableOpacity style={styles.mealsAddButton} onPress={() => navigation.navigate('LogFood')}>
                            <Ionicons name="add" size={20} color={theme.colors.surface} style={{ marginRight: 8 }} />
                            <Text style={styles.mealsAddButtonText}>Registrar primera comida</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginTop: 16, marginBottom: 8 },
    errorText: { fontSize: 14, color: theme.colors.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    retryButton: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: theme.borderRadius.md },
    retryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    safeArea: { flex: 1, backgroundColor: theme.colors.surface },

    topBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: theme.spacing.lg, paddingVertical: 12, borderBottomWidth: 1,
        borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface
    },
    logoRow: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { backgroundColor: theme.colors.primary, padding: 6, borderRadius: 8, marginRight: 10 },
    logoText: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
    avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.secondary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 },

    container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },

    greeting: { fontSize: 16, color: theme.colors.textLight, marginBottom: 4 },
    mainTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 8 },
    subtitle: { fontSize: 14, color: theme.colors.textLight, marginBottom: 24, lineHeight: 20 },

    mainButton: { backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: theme.borderRadius.md, marginBottom: 32 },
    mainButtonText: { color: theme.colors.surface, fontSize: 16, fontWeight: 'bold' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
    seeMore: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
    macroCard: {
        width: '48%', backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.borderRadius.md,
        marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    macroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    macroTitle: { fontSize: 12, fontWeight: '600', color: theme.colors.textLight, letterSpacing: 0.5 },
    macroValue: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 12 },
    macroTarget: { fontSize: 14, fontWeight: 'normal', color: theme.colors.textLight },

    progressBarBg: { height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: theme.colors.secondary },

    progressStatsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    progressStatCard: {
        width: '31%', backgroundColor: theme.colors.surface, paddingVertical: 16, borderRadius: theme.borderRadius.md,
        alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    progressStatValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 2 },
    progressStatLabel: { fontSize: 12, color: theme.colors.textLight },

    // Card de progreso de nivel
    levelProgressCard: {
        backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
        padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    levelProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    levelBadgeText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
    levelNextLabel: { fontSize: 13, color: theme.colors.textLight, fontWeight: '500' },
    levelBarBg: { height: 10, backgroundColor: theme.colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
    levelBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 5 },
    levelProgressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    levelXpCurrent: { fontSize: 12, color: theme.colors.textLight },
    levelXpNeeded: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },

    recommendationCard: {
        backgroundColor: theme.colors.surface, padding: 20, borderRadius: theme.borderRadius.md, marginBottom: 24,
        borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    recommendationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    recommendationCategory: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
    recommendationTitle: { fontSize: 15, fontWeight: 'bold', color: theme.colors.text },
    recommendationText: { fontSize: 14, color: theme.colors.textLight, lineHeight: 21 },

    mealsCard: {
        backgroundColor: theme.colors.surface, padding: 32, borderRadius: theme.borderRadius.md, alignItems: 'center',
        borderWidth: 1, borderColor: theme.colors.border, marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    mealsEmptyText: { fontSize: 15, color: theme.colors.textLight, marginBottom: 20, textAlign: 'center' },
    mealsAddButton: {
        backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8
    },
    mealsAddButtonText: { color: theme.colors.surface, fontSize: 14, fontWeight: 'bold' },

    mealItemCard: {
        backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.borderRadius.md,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    mealItemLeft: { flexDirection: 'row', alignItems: 'center' },
    mealItemInfo: { marginLeft: 12 },
    mealItemName: { fontSize: 15, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 },
    mealItemMacros: { fontSize: 12, color: theme.colors.textLight },
    mealItemCals: { fontSize: 15, fontWeight: 'bold', color: theme.colors.primary }
});

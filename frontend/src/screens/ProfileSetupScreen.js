import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';
import { theme } from '../theme';

export default function ProfileSetupScreen() {
    const { setUser, logout } = useContext(AuthContext);

    const navigation = useNavigation();

    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [gender, setGender] = useState('male');
    const [activityLevel, setActivityLevel] = useState(1.2);
    const [dietaryRestriction, setDietaryRestriction] = useState('none');
    const [goal, setGoal] = useState('maintain');
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Mejora #8: Validación inline por campo
    const [errors, setErrors] = useState({ age: '', weight: '', height: '' });

    const validateField = (field, value) => {
        const num = parseFloat(value);
        let msg = '';
        if (field === 'age' && value && (isNaN(num) || num < 10 || num > 120)) msg = 'Edad inválida (10-120 años)';
        if (field === 'weight' && value && (isNaN(num) || num < 20 || num > 300)) msg = 'Peso inválido (20-300 kg)';
        if (field === 'height' && value && (isNaN(num) || num < 100 || num > 250)) msg = 'Altura inválida (100-250 cm)';
        setErrors(prev => ({ ...prev, [field]: msg }));
    };

    useFocusEffect(
        React.useCallback(() => {
            const fetchProfile = async () => {
                try {
                    const res = await apiClient.get('/profile');
                    if (res.data) {
                        setAge(res.data.age?.toString() || '');
                        setWeight(res.data.weight?.toString() || '');
                        setHeight(res.data.height?.toString() || '');
                        setGender(res.data.gender || 'male');
                        setActivityLevel(res.data.activityLevel || 1.2);
                        setDietaryRestriction(res.data.dietaryRestriction || 'none');
                        setGoal(res.data.goal || 'maintain');
                        setIsEditing(true);
                    }
                } catch (error) {
                    // Si tira error (ej. 404 porque no existe perfil), no hacemos nada (flow normal de onboarding)
                }
            };
            fetchProfile();
        }, [])
    );

    const handleSubmit = async () => {
        // Mejora #8: Validar inline antes de enviar
        const ageNum = parseInt(age), weightNum = parseFloat(weight), heightNum = parseFloat(height);
        const newErrors = {
            age: !age || isNaN(ageNum) || ageNum < 10 || ageNum > 120 ? 'Edad inválida (10-120 años)' : '',
            weight: !weight || isNaN(weightNum) || weightNum < 20 || weightNum > 300 ? 'Peso inválido (20-300 kg)' : '',
            height: !height || isNaN(heightNum) || heightNum < 100 || heightNum > 250 ? 'Altura inválida (100-250 cm)' : '',
        };
        setErrors(newErrors);
        if (Object.values(newErrors).some(e => e)) return; // Hay errores, no enviar

        setLoading(true);
        try {
            await apiClient.post('/profile', {
                age: parseInt(age),
                weight: parseFloat(weight),
                height: parseFloat(height),
                gender,
                activityLevel,
                dietaryRestriction,
                goal
            });

            // Actualizar contexto forzando render de MainTabs si era onboarding
            setUser(prev => ({ ...prev, hasProfile: true }));

            if (isEditing) {
                Alert.alert('Éxito', 'Perfil actualizado correctamente.');
                navigation.goBack(); // Vuelve a settings
            }

        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Error guardando tu perfil.');
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >

            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="restaurant-outline" size={32} color={theme.colors.surface} />
                </View>
                <Text style={styles.title}>{isEditing ? 'Editar Perfil' : 'BiteQuest'}</Text>
                <Text style={styles.subtitle}>{isEditing ? 'Actualiza tu información para recalcular metas' : 'Configuremos tu perfil para personalizar tus metas'}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Información Física</Text>

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Edad (Años)</Text>
                        <TextInput
                            style={[styles.input, errors.age && styles.inputError]}
                            keyboardType="numeric" value={age}
                            onChangeText={v => { setAge(v); validateField('age', v); }}
                            placeholder="Ej: 25" placeholderTextColor={theme.colors.textLight}
                        />
                        {!!errors.age && <Text style={styles.fieldError}>{errors.age}</Text>}
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Altura (Cm)</Text>
                        <TextInput
                            style={[styles.input, errors.height && styles.inputError]}
                            keyboardType="numeric" value={height}
                            onChangeText={v => { setHeight(v); validateField('height', v); }}
                            placeholder="Ej: 175" placeholderTextColor={theme.colors.textLight}
                        />
                        {!!errors.height && <Text style={styles.fieldError}>{errors.height}</Text>}
                    </View>
                </View>

                <Text style={styles.label}>Peso Actual (Kg)</Text>
                <TextInput
                    style={[styles.input, errors.weight && styles.inputError]}
                    keyboardType="numeric" value={weight}
                    onChangeText={v => { setWeight(v); validateField('weight', v); }}
                    placeholder="Ej: 70.5" placeholderTextColor={theme.colors.textLight}
                />
                {!!errors.weight && <Text style={styles.fieldError}>{errors.weight}</Text>}

                <Text style={styles.label}>Género Biológico (Para TMB)</Text>
                <View style={styles.pickerContainer}>
                    <Picker selectedValue={gender} onValueChange={(v) => setGender(v)}>
                        <Picker.Item label="Masculino" value="male" />
                        <Picker.Item label="Femenino" value="female" />
                        <Picker.Item label="Otro" value="other" />
                    </Picker>
                </View>

                <Text style={styles.label}>Nivel de Actividad Física</Text>
                <View style={styles.pickerContainer}>
                    <Picker selectedValue={activityLevel} onValueChange={(v) => setActivityLevel(Number(v))}>
                        <Picker.Item label="Sedentario (Poquísimo nivel)" value={1.2} />
                        <Picker.Item label="Poco activo (1-3 días/semana)" value={1.375} />
                        <Picker.Item label="Medio (3-5 días/semana)" value={1.55} />
                        <Picker.Item label="Alto (6-7 días/semana)" value={1.725} />
                        <Picker.Item label="Muy alto (Doble sesión/físico fuerte)" value={1.9} />
                    </Picker>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Preferencias y Metas</Text>

                <Text style={styles.label}>Restricción Alimentaria</Text>
                <View style={styles.pickerContainer}>
                    <Picker selectedValue={dietaryRestriction} onValueChange={(v) => setDietaryRestriction(v)}>
                        <Picker.Item label="Ninguna" value="none" />
                        <Picker.Item label="Vegetariano" value="vegetarian" />
                        <Picker.Item label="Vegano" value="vegan" />
                        <Picker.Item label="Celíaco" value="celiac" />
                    </Picker>
                </View>

                <Text style={styles.label}>Objetivo Personal</Text>
                <View style={styles.pickerContainer}>
                    <Picker selectedValue={goal} onValueChange={(v) => setGoal(v)}>
                        <Picker.Item label="Bajar de peso" value="lose_weight" />
                        <Picker.Item label="Mantener peso" value="maintain" />
                        <Picker.Item label="Ganar masa muscular" value="gain_muscle" />
                    </Picker>
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.buttonText}>{isEditing ? 'Guardar Cambios' : 'Comenzar mi aventura'}</Text>}
            </TouchableOpacity>

            {!isEditing && (
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
                </TouchableOpacity>
            )}

        </ScrollView>
    );

    return (
        <View style={[styles.safeArea, Platform.OS === 'web' && { height: '100vh' }]}>
            {Platform.OS === 'ios' ? (
                <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                    {renderForm()}
                </KeyboardAvoidingView>
            ) : (
                renderForm()
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.surface },
    container: { flexGrow: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.surface },

    header: { alignItems: 'center', marginBottom: theme.spacing.md, marginTop: 10 },
    iconContainer: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: theme.borderRadius.md, marginBottom: 8 },
    title: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text, marginBottom: 2 },
    subtitle: { fontSize: 13, color: theme.colors.textLight, textAlign: 'center', paddingHorizontal: 10 },

    card: {
        backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.md,
        borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12
    },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text, marginBottom: 8 },

    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfInput: { width: '48%' },

    label: { fontSize: 13, fontWeight: '500', color: theme.colors.text, marginBottom: 4, marginTop: 4 },
    input: {
        padding: 10, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.border,
        fontSize: 14, marginBottom: 6, color: theme.colors.text
    },

    pickerContainer: {
        borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 4, overflow: 'hidden', height: 40, justifyContent: 'center'
    },

    button: {
        backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: theme.borderRadius.md,
        alignItems: 'center', marginBottom: 8, marginTop: 4
    },
    buttonText: { color: theme.colors.surface, fontSize: 15, fontWeight: 'bold' },

    logoutButton: { alignItems: 'center', marginBottom: 10, paddingVertical: 8 },
    logoutButtonText: { color: theme.colors.error, fontSize: 14, fontWeight: '600' },

    // Mejora #8: Estilos de validación inline
    inputError: { borderColor: '#E53935' },
    fieldError: { fontSize: 11, color: '#E53935', marginTop: -4, marginBottom: 4 },
});

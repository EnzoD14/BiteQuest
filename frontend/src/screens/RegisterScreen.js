import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../utils/alerts';

export default function RegisterScreen({ navigation }) {
    const { register } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const [disclaimerError, setDisclaimerError] = useState(false);

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            showAlert('Error', 'Por favor completa todos los campos');
            return;
        }
        if (password !== confirmPassword) {
            showAlert('Error', 'Las contraseñas no coinciden');
            return;
        }
        if (!disclaimerAccepted) {
            setDisclaimerError(true);
            showAlert('Aviso requerido', 'Debés aceptar el aviso legal antes de crear tu cuenta.');
            return;
        }
        setDisclaimerError(false);
        setLoading(true);
        try {
            await register(email, password, name.trim());
        } catch (error) {
            showAlert('Error', error.response?.data?.message || 'Error al registrar usuario');
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

            <View style={styles.logoContainer}>
                <View style={styles.iconBox}>
                    <Ionicons name="restaurant-outline" size={32} color={theme.colors.surface} />
                </View>
                <Text style={styles.title}>BiteQuest</Text>
                <Text style={styles.subtitle}>Comienza tu aventura nutricional</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Crear cuenta</Text>
                <Text style={styles.cardSubtitle}>Ingresa tus datos para registrarte</Text>

                <Text style={styles.label}>Nombre</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Tu nombre"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    placeholderTextColor={theme.colors.textLight}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={theme.colors.textLight}
                />

                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.inputPassword}
                        placeholder="........"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        placeholderTextColor={theme.colors.textLight}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.colors.textLight} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirmar contraseña</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.inputPassword}
                        placeholder="........"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirm}
                        placeholderTextColor={theme.colors.textLight}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                        <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={theme.colors.textLight} />
                    </TouchableOpacity>
                </View>

                {/* Disclaimer médico — aceptación obligatoria */}
                <TouchableOpacity
                    style={[styles.disclaimerBox, disclaimerError && !disclaimerAccepted && styles.disclaimerBoxError]}
                    onPress={() => { setDisclaimerAccepted(!disclaimerAccepted); setDisclaimerError(false); }}
                    activeOpacity={0.8}
                >
                    <View style={[styles.checkbox, disclaimerAccepted && styles.checkboxChecked]}>
                        {disclaimerAccepted && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                    <Text style={styles.disclaimerText}>
                        Entiendo que <Text style={styles.disclaimerBold}>BiteQuest no reemplaza a un nutricionista</Text> ni constituye asesoramiento médico profesional. Las recomendaciones son orientativas y basadas en fórmulas estándar.
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, !disclaimerAccepted && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.surface} />
                    ) : (
                        <Text style={styles.buttonText}>Crear cuenta</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footerRow}>
                    <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Inicia sesión</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </ScrollView>
    );

    return (
        <View style={[styles.safeArea, Platform.OS === 'web' && { height: '100vh' }]}>
            {/* Mejora #5: KeyboardAvoidingView en iOS y Android */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {renderForm()}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.surface },
    container: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.surface },

    logoContainer: { alignItems: 'center', marginBottom: theme.spacing.xl, marginTop: 40 },
    iconBox: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: theme.borderRadius.md, marginBottom: 12 },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 },
    subtitle: { fontSize: 16, color: theme.colors.textLight, textAlign: 'center' },

    card: {
        backgroundColor: theme.colors.surface, padding: theme.spacing.xl, borderRadius: theme.borderRadius.lg,
        borderWidth: 1, borderColor: theme.colors.border, marginBottom: 40
    },
    cardTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 },
    cardSubtitle: { fontSize: 14, color: theme.colors.textLight, marginBottom: 24 },

    label: { fontSize: 14, fontWeight: '500', color: theme.colors.text, marginBottom: 8 },
    input: {
        padding: 14, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border,
        fontSize: 16, marginBottom: 20, color: theme.colors.text
    },
    passwordContainer: {
        flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md, paddingHorizontal: 14, marginBottom: 24
    },
    inputPassword: { flex: 1, paddingVertical: 14, fontSize: 16, color: theme.colors.text },

    // Disclaimer médico
    disclaimerBox: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: '#F8FCF4', borderRadius: theme.borderRadius.md,
        borderWidth: 1, borderColor: theme.colors.border,
        padding: 14, marginBottom: 20, gap: 12
    },
    disclaimerBoxError: { borderColor: '#E53935', backgroundColor: '#FFF5F5' },
    checkbox: {
        width: 22, height: 22, borderRadius: 5, borderWidth: 2,
        borderColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center',
        marginTop: 1, flexShrink: 0
    },
    checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    disclaimerText: { flex: 1, fontSize: 13, color: theme.colors.textLight, lineHeight: 19 },
    disclaimerBold: { fontWeight: '700', color: theme.colors.text },

    button: {
        backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: theme.borderRadius.md, alignItems: 'center',
        marginBottom: 20
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: theme.colors.surface, fontSize: 16, fontWeight: 'bold' },

    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { fontSize: 14, color: theme.colors.textLight },
    linkText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary }
});


import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e, p) => {
        const mail = e || email;
        const pass = p || password;
        if (!mail || !pass) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            await login(mail, pass);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Error al iniciar sesión');
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
                <Text style={styles.subtitle}>Tu asistente nutricional gamificado</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Iniciar sesión</Text>
                <Text style={styles.cardSubtitle}>Ingresa tus credenciales para continuar</Text>

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

                {/* Mejora #4: botón de auto-fill en lugar de caja visible permanente */}
                <TouchableOpacity
                    style={styles.demoBox}
                    onPress={() => { setEmail('demo@bitequest.app'); setPassword('demo123'); }}
                >
                    <Ionicons name="flash-outline" size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.demoText}>Usar credenciales de demo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => handleLogin(null, null)} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={theme.colors.surface} />
                    ) : (
                        <Text style={styles.buttonText}>Iniciar sesión</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footerRow}>
                    <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.linkText}>Regístrate</Text>
                    </TouchableOpacity>
                </View>
            </View>

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
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.background },

    logoContainer: { alignItems: 'center', marginBottom: theme.spacing.xl },
    iconBox: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 16, marginBottom: 16, width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 6 },
    subtitle: { fontSize: 16, color: theme.colors.textLight },

    card: {
        backgroundColor: theme.colors.surface, padding: theme.spacing.xl, borderRadius: theme.borderRadius.lg,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
        borderWidth: 1, borderColor: theme.colors.border
    },
    cardTitle: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 6 },
    cardSubtitle: { fontSize: 14, color: theme.colors.textLight, marginBottom: 28 },

    label: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
    input: {
        padding: 14, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border,
        fontSize: 15, marginBottom: 20, color: theme.colors.text
    },
    passwordContainer: {
        flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md, paddingHorizontal: 14, marginBottom: 20
    },
    inputPassword: { flex: 1, paddingVertical: 14, fontSize: 15, color: theme.colors.text },

    demoBox: {
        backgroundColor: '#EAECE9', padding: 12, borderRadius: theme.borderRadius.md, marginBottom: 24,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
    },
    demoText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },

    button: {
        backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: theme.borderRadius.md, alignItems: 'center',
        marginBottom: 24
    },
    buttonText: { color: theme.colors.surface, fontSize: 16, fontWeight: 'bold' },

    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { fontSize: 14, color: theme.colors.textLight },
    linkText: { fontSize: 14, fontWeight: 'bold', color: theme.colors.primary }
});

import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';

// Pantallas
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LogFoodScreen from '../screens/LogFoodScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);

const MainTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textLight,
            tabBarStyle: {
                backgroundColor: theme.colors.surface,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                height: 65,
                paddingBottom: 8,
                paddingTop: 8,
                elevation: 10,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            tabBarLabelStyle: { fontSize: 12, fontWeight: '500', marginTop: -4 },
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === 'Dashboard') {
                    iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Progreso') {
                    iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                } else if (route.name === 'Retos') {
                    iconName = focused ? 'trophy' : 'trophy-outline';
                } else if (route.name === 'Ajustes') {
                    iconName = focused ? 'settings' : 'settings-outline';
                }

                return <Ionicons name={iconName} size={24} color={color} />;
            },
        })}
    >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Inicio' }} />
        <Tab.Screen name="Progreso" component={ProgressScreen} options={{ tabBarLabel: 'Progreso' }} />

        {/* Botón Central Flotante */}
        <Tab.Screen
            name="LogFood"
            component={LogFoodScreen}
            options={{
                tabBarLabel: '',
                tabBarIcon: () => (
                    <View style={styles.floatingButton}>
                        <Ionicons name="add" size={32} color={theme.colors.surface} />
                    </View>
                )
            }}
        />

        <Tab.Screen name="Retos" component={ChallengesScreen} options={{ tabBarLabel: 'Logros' }} />
        <Tab.Screen name="Ajustes" component={SettingsScreen} options={{ tabBarLabel: 'Ajustes' }} />
    </Tab.Navigator>
);

const MainStackComp = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
);

const styles = StyleSheet.create({
    floatingButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24, // Eleva el botón sobre el tab
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    }
});

export default function AppNavigator() {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? (
                // Si no tiene perfil, forzamos el Onboarding (Obligatorio MVP)
                user.hasProfile ? (
                    <MainStackComp />
                ) : (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                    </Stack.Navigator>
                )
            ) : (
                <AuthStack />
            )}
        </NavigationContainer>
    );
}

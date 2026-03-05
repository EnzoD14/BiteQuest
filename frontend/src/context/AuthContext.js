import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import apiClient, { setLogoutCallback } from '../api/client'; // Mejora #1: 401 interceptor callback

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Mejora #1: Registrar callback de logout para el interceptor 401 de apiClient
    useEffect(() => {
        setLogoutCallback(() => {
            AsyncStorage.removeItem('@BiteQuest_Token');
            AsyncStorage.removeItem('@BiteQuest_User');
            setUser(null);
        });
        return () => setLogoutCallback(null); // Limpiar al desmontar
    }, []);

    // Restaurar sesión persistente
    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const token = await AsyncStorage.getItem('@BiteQuest_Token');
                const userInfo = await AsyncStorage.getItem('@BiteQuest_User');

                if (token && userInfo) {
                    // Mejora #9: Decode con jwtDecode en lugar de atob() (no existe en RN nativo)
                    try {
                        const payload = jwtDecode(token);
                        const isExpired = payload.exp * 1000 < Date.now();
                        if (isExpired) {
                            await AsyncStorage.removeItem('@BiteQuest_Token');
                            await AsyncStorage.removeItem('@BiteQuest_User');
                        } else {
                            setUser(JSON.parse(userInfo));
                        }
                    } catch {
                        // Token malformado: limpiar
                        await AsyncStorage.removeItem('@BiteQuest_Token');
                        await AsyncStorage.removeItem('@BiteQuest_User');
                    }
                }
            } catch (error) {
                console.error("Error loading auth data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadStorageData();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const { token, ...userData } = response.data;

            await AsyncStorage.setItem('@BiteQuest_Token', token);
            await AsyncStorage.setItem('@BiteQuest_User', JSON.stringify(userData));
            setUser(userData);

            // Enviamos telemetría directamente con el token recién obtenido
            // (no usamos recordTelemetry porque `user` aún no fue seteado en el estado React)
            try {
                await apiClient.post('/telemetry', { event: 'SESSION_START', sessionDurationMs: 0, metadata: {} });
            } catch (_) { /* ignoramos errores de telemetría */ }
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    const register = async (email, password, name = '') => {
        try {
            const response = await apiClient.post('/auth/register', { email, password, name });
            const { token, ...userData } = response.data;

            await AsyncStorage.setItem('@BiteQuest_Token', token);
            await AsyncStorage.setItem('@BiteQuest_User', JSON.stringify(userData));
            setUser({ ...userData, hasProfile: false });

            return response.data;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('@BiteQuest_Token');
        await AsyncStorage.removeItem('@BiteQuest_User');
        setUser(null);
    };

    // Ley 25.326: Telemetría Experimental Silenciosa
    const recordTelemetry = async (event, sessionDurationMs = 0, metadata = {}) => {
        try {
            if (user) {
                await apiClient.post('/telemetry', {
                    event,
                    sessionDurationMs,
                    metadata
                });
            }
        } catch (err) {
            // Ignoramos errores de telemetría para no afectar la UX
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, setUser, recordTelemetry }}>
            {children}
        </AuthContext.Provider>
    );
};

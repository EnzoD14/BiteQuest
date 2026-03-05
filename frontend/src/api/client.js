import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Determina la IP local según el entorno
const API_URL = Platform.OS === 'web'
    ? 'http://localhost:5000/api'
    : 'http://10.0.2.2:5000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000, // Mejora #9: 10s en lugar de 5s para operaciones legítimamente más lentas
});

// Interceptor REQUEST: inyectar JWT en todas las peticiones
apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('@BiteQuest_Token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Mejora #1: Interceptor RESPONSE – detecta 401 y fuerza logout automático
// Evitamos import circular con AuthContext usando un callback inyectable
let _logoutCallback = null;
export const setLogoutCallback = (fn) => { _logoutCallback = fn; };

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Limpiar storage y disparar logout si hay callback registrado
            await AsyncStorage.removeItem('@BiteQuest_Token');
            await AsyncStorage.removeItem('@BiteQuest_User');
            if (_logoutCallback) _logoutCallback();
        }
        return Promise.reject(error);
    }
);

export default apiClient;

import React from 'react';
import { View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={[
        { flex: 1 },
        Platform.OS === 'web' && {
          maxWidth: 480,
          width: '100%',
          marginHorizontal: 'auto',
          backgroundColor: '#fff',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }
      ]}>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

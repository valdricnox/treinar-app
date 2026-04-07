import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, RootState } from './src/store';
import { C, F } from './src/theme';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ChecklistsScreen from './src/screens/ChecklistsScreen';
import ChecklistDetailScreen from './src/screens/ChecklistDetailScreen';
import NewChecklistScreen from './src/screens/NewChecklistScreen';
import IncidentsScreen from './src/screens/IncidentsScreen';
import NewIncidentScreen from './src/screens/NewIncidentScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TeamScreen from './src/screens/TeamScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ChecklistStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: C.black }, headerTintColor: C.primary, headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="Checklists" component={ChecklistsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChecklistDetail" component={ChecklistDetailScreen} options={{ title: 'Detalhe da Inspeção' }} />
      <Stack.Screen name="NewChecklist" component={NewChecklistScreen} options={{ title: 'Nova Inspeção' }} />
    </Stack.Navigator>
  );
}

function IncidentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: C.black }, headerTintColor: C.primary, headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="Incidents" component={IncidentsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NewIncident" component={NewIncidentScreen} options={{ title: 'Novo Incidente' }} />
    </Stack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: any = {
    Dashboard: '📊', Inspeções: '📋', Incidentes: '⚠️', Relatórios: '📄', Equipe: '👥', Perfil: '👤',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={focused ? ic.activeDot : null} />
      <View style={[ic.iconBox, focused && ic.iconBoxActive]}>
        <ActivityIndicator style={{ display: 'none' }} />
        <View><View><View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}></View></View></View>
      </View>
    </View>
  );
}

function MainApp() {
  const { isLoggedIn, user } = useSelector((s: RootState) => s.auth);
  const isAdminOrGestor = user?.role === 'admin' || user?.role === 'gestor';

  if (!isLoggedIn) return <LoginScreen />;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.black,
          borderTopColor: '#2A2A2A',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: F.xs, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ focused }) => <TabEmoji emoji="📊" focused={focused} />, tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="Inspeções" component={ChecklistStack} options={{ tabBarIcon: ({ focused }) => <TabEmoji emoji="📋" focused={focused} />, tabBarLabel: 'Inspeções' }} />
      <Tab.Screen name="Incidentes" component={IncidentStack} options={{ tabBarIcon: ({ focused }) => <TabEmoji emoji="⚠️" focused={focused} />, tabBarLabel: 'Incidentes' }} />
      <Tab.Screen name="Relatórios" component={ReportsScreen} options={{ tabBarIcon: ({ focused }) => <TabEmoji emoji="📄" focused={focused} />, tabBarLabel: 'Relatórios' }} />
      {isAdminOrGestor
        ? <Tab.Screen name="Equipe" component={TeamScreen} options={{ tabBarIcon: ({ focused }) => <TabEmoji emoji="👥" focused={focused} />, tabBarLabel: 'Equipe' }} />
        : <Tab.Screen name="Perfil" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabEmoji emoji="👤" focused={focused} />, tabBarLabel: 'Perfil' }} />
      }
    </Tab.Navigator>
  );
}

function TabEmoji({ emoji, focused }: { emoji: string; focused: boolean }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    const { Text, View, TouchableOpacity } = require('react-native');
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.black, padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
          <Text style={{ color: C.white, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Algo deu errado</Text>
          <Text style={{ color: '#666', textAlign: 'center', marginBottom: 24 }}>Reinicie o aplicativo para continuar.</Text>
          <TouchableOpacity
            style={{ backgroundColor: C.primary, padding: 16, borderRadius: 12 }}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={{ fontWeight: '700', color: C.black }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <Provider store={store}>
            <PersistGate loading={<View style={s.loading}><ActivityIndicator color={C.primary} size="large" /></View>} persistor={persistor}>
              <NavigationContainer>
                <MainApp />
              </NavigationContainer>
            </PersistGate>
          </Provider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center' },
});

const ic = StyleSheet.create({
  iconBox: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  iconBoxActive: { backgroundColor: 'rgba(245,200,0,0.15)' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary, position: 'absolute', top: -6 },
});

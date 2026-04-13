import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import Svg, { Path, Line, Rect, Circle, Polyline } from 'react-native-svg';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store, persistor, RootState, setOnline, clearAuth, setOnboardingComplete } from './src/store';
import { C, F, S } from './src/theme';
import { syncPendingData } from './src/services/syncService';

import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ChecklistsScreen from './src/screens/ChecklistsScreen';
import ChecklistDetailScreen from './src/screens/ChecklistDetailScreen';
import ChecklistWizardScreen from './src/screens/ChecklistWizardScreen';
import NewChecklistScreen from './src/screens/NewChecklistScreen';
import IncidentsScreen from './src/screens/IncidentsScreen';
import NewIncidentScreen from './src/screens/NewIncidentScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TeamScreen from './src/screens/TeamScreen';
import AdminScreen from './src/screens/AdminScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import AcoesScreen from './src/screens/AcoesScreen';
import ObrasScreen from './src/screens/ObrasScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const STACK_OPTS = {
  headerStyle: { backgroundColor: C.black },
  headerTintColor: C.primary,
  headerTitleStyle: { fontWeight: '700' as const, color: C.white },
  headerBackTitleVisible: false,
};

const SZ = 22, SW2 = 1.6;

function IcDashboard({ c }: { c: string }) {
  return <Svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="13" width="4" height="8" rx="1" fill={c} />
    <Rect x="10" y="8" width="4" height="13" rx="1" fill={c} />
    <Rect x="17" y="3" width="4" height="18" rx="1" fill={c} />
  </Svg>;
}
function IcList({ c }: { c: string }) {
  return <Svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="2" width="16" height="20" rx="2" stroke={c} strokeWidth={SW2} />
    <Line x1="8" y1="8" x2="16" y2="8" stroke={c} strokeWidth={SW2} strokeLinecap="round" />
    <Line x1="8" y1="12" x2="16" y2="12" stroke={c} strokeWidth={SW2} strokeLinecap="round" />
    <Line x1="8" y1="16" x2="13" y2="16" stroke={c} strokeWidth={SW2} strokeLinecap="round" />
  </Svg>;
}
function IcAlert({ c }: { c: string }) {
  return <Svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3L21.5 20H2.5L12 3Z" stroke={c} strokeWidth={SW2} strokeLinejoin="round" />
    <Line x1="12" y1="10" x2="12" y2="14" stroke={c} strokeWidth={SW2} strokeLinecap="round" />
    <Circle cx="12" cy="17.5" r="0.8" fill={c} />
  </Svg>;
}
function IcReport({ c }: { c: string }) {
  return <Svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="2" width="13" height="17" rx="2" stroke={c} strokeWidth={SW2} />
    <Path d="M9 21v-3l3 1.5 3-1.5v3" stroke={c} strokeWidth={SW2} strokeLinejoin="round" fill="none" />
    <Line x1="7" y1="8" x2="13" y2="8" stroke={c} strokeWidth={SW2} strokeLinecap="round" />
    <Line x1="7" y1="12" x2="13" y2="12" stroke={c} strokeWidth={SW2} strokeLinecap="round" />
  </Svg>;
}
function IcTeam({ c }: { c: string }) {
  return <Svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="7" r="3" stroke={c} strokeWidth={SW2} />
    <Path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke={c} strokeWidth={SW2} strokeLinecap="round" fill="none" />
    <Circle cx="18" cy="8" r="2" stroke={c} strokeWidth={SW2} />
    <Path d="M22 20c0-2.21-1.79-4-4-4" stroke={c} strokeWidth={SW2} strokeLinecap="round" fill="none" />
  </Svg>;
}
function IcUser({ c }: { c: string }) {
  return <Svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={c} strokeWidth={SW2} />
    <Path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={c} strokeWidth={SW2} strokeLinecap="round" fill="none" />
  </Svg>;
}
function IcAdmin({ c }: { c: string }) {
  return <Svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={SW2} />
    <Path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={c} strokeWidth={SW2} strokeLinecap="round" fill="none" />
  </Svg>;
}
function IcActions({ c }: { c: string }) {
  return <Svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 11 12 14 22 4" stroke={c} strokeWidth={SW2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke={c} strokeWidth={SW2} strokeLinecap="round" fill="none" />
  </Svg>;
}
function IcBuilding({ c }: { c: string }) {
  return <Svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="3" width="20" height="18" rx="1" stroke={c} strokeWidth={SW2} />
    <Path d="M8 21V3M16 21V3M2 9h6M16 9h6M2 15h6M16 15h6" stroke={c} strokeWidth={SW2} strokeLinecap="round" fill="none" />
  </Svg>;
}

function ChecklistStack() {
  return (
    <Stack.Navigator screenOptions={STACK_OPTS}>
      <Stack.Screen name="Checklists" component={ChecklistsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChecklistDetail" component={ChecklistDetailScreen} options={{ title: 'Detalhe' }} />
      <Stack.Screen name="ChecklistWizard" component={ChecklistWizardScreen} options={{ title: 'Vistoria' }} />
      <Stack.Screen name="NewChecklist" component={NewChecklistScreen} options={{ title: 'Nova Inspeção' }} />
    </Stack.Navigator>
  );
}
function IncidentStack() {
  return (
    <Stack.Navigator screenOptions={STACK_OPTS}>
      <Stack.Screen name="Incidents" component={IncidentsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NewIncident" component={NewIncidentScreen} options={{ title: 'Registrar Incidente' }} />
    </Stack.Navigator>
  );
}

// ─── Network + Auto-Sync ──────────────────────────────────────────────────────
function NetworkMonitor() {
  const dispatch = useDispatch();
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(async (state) => {
      const online = !!state.isConnected;
      dispatch(setOnline(online));

      // Auto-sync when coming back online
      if (online && wasOffline.current) {
        wasOffline.current = false;
        const synced = await syncPendingData();
        if (synced && synced > 0) {
          Alert.alert('Sincronizado', `${synced} item(s) sincronizado(s) com o servidor.`);
        }
      }
      if (!online) wasOffline.current = true;
    });
    return () => unsub();
  }, []);
  return null;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function MainApp() {
  const { isLoggedIn, user } = useSelector((s: RootState) => s.auth);
  const onboardingComplete = useSelector((s: RootState) => (s.app as any).onboardingComplete);
  const dispatch = useDispatch();
  const isAdminOrGestor = user?.role === 'admin' || user?.role === 'gestor';
  const isAdmin = user?.email === 'armindo@treinar.eng.br';

  if (!isLoggedIn) {
    if (!onboardingComplete) return <OnboardingScreen />;
    return <LoginScreen />;
  }

  const doLogout = async () => {
    await AsyncStorage.removeItem('token');
    dispatch(clearAuth());
  };

  const LogoutBtn = () => (
    <TouchableOpacity onPress={doLogout} style={{ marginRight: S.md, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="rgba(255,255,255,0.35)" strokeWidth={1.8} strokeLinecap="round" />
        <Polyline points="16 17 21 12 16 7" stroke="rgba(255,255,255,0.35)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Line x1="21" y1="12" x2="9" y2="12" stroke="rgba(255,255,255,0.35)" strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' }}>Sair</Text>
    </TouchableOpacity>
  );

  const tabStyle = {
    backgroundColor: C.black,
    borderTopColor: 'rgba(255,255,255,0.07)',
    borderTopWidth: 1 as const,
    height: 68,
    paddingBottom: 10,
    paddingTop: 8,
  };
  const tabLabelStyle = { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.2, marginTop: 2 };

  return (
    <>
      <NetworkMonitor />
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: tabStyle,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.28)',
        tabBarLabelStyle: tabLabelStyle,
      }}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{
          tabBarIcon: ({ color }) => <IcDashboard c={color} />,
          headerShown: true,
          headerStyle: { backgroundColor: C.black },
          headerTitle: '',
          headerRight: () => <LogoutBtn />,
        }} />
        <Tab.Screen name="Inspeções" component={ChecklistStack} options={{ tabBarIcon: ({ color }) => <IcList c={color} /> }} />
        <Tab.Screen name="Incidentes" component={IncidentStack} options={{ tabBarIcon: ({ color }) => <IcAlert c={color} /> }} />
        <Tab.Screen name="Ações" component={AcoesScreen} options={{ tabBarIcon: ({ color }) => <IcActions c={color} /> }} />
        {isAdminOrGestor && (
          <Tab.Screen name="Obras" component={ObrasScreen} options={{ tabBarIcon: ({ color }) => <IcBuilding c={color} /> }} />
        )}
        <Tab.Screen name="Relatórios" component={ReportsScreen} options={{ tabBarIcon: ({ color }) => <IcReport c={color} /> }} />
        {isAdminOrGestor
          ? <Tab.Screen name="Equipe" component={TeamScreen} options={{ tabBarIcon: ({ color }) => <IcTeam c={color} /> }} />
          : <Tab.Screen name="Perfil" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <IcUser c={color} /> }} />
        }
        {isAdmin && <Tab.Screen name="Admin" component={AdminScreen} options={{ tabBarIcon: ({ color }) => <IcAdmin c={color} /> }} />}
      </Tab.Navigator>
    </>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.c}>
          <Text style={eb.e}>⚠️</Text>
          <Text style={eb.t}>Algo deu errado</Text>
          <Text style={eb.m}>{this.state.error?.message}</Text>
          <TouchableOpacity style={eb.b} onPress={() => this.setState({ hasError: false, error: null })}>
            <Text style={eb.bt}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  c: { flex: 1, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center', padding: S.xl },
  e: { fontSize: 48, marginBottom: S.md },
  t: { fontSize: F.xl, fontWeight: '800', color: C.white, marginBottom: S.sm },
  m: { fontSize: F.sm, color: C.gray500, textAlign: 'center', marginBottom: S.xl },
  b: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: S.xl, paddingVertical: S.md },
  bt: { fontWeight: '800', color: C.black, fontSize: F.md },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <Provider store={store}>
            <PersistGate loading={
              <View style={{ flex: 1, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={C.primary} size="large" />
                <Text style={{ color: C.gray500, marginTop: S.md, fontSize: F.sm }}>Carregando...</Text>
              </View>
            } persistor={persistor}>
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

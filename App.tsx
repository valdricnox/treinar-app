import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import NetInfo from '@react-native-community/netinfo';
import { store, persistor, RootState, setOnline } from './src/store';
import { C, F, S } from './src/theme';

// Screens
import LoginScreen from './src/screens/LoginScreen';
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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const STACK_OPTS = {
  headerStyle: { backgroundColor: C.black },
  headerTintColor: C.primary,
  headerTitleStyle: { fontWeight: '700' as const, color: C.white },
  headerBackTitleVisible: false,
};

function ChecklistStack() {
  return (
    <Stack.Navigator screenOptions={STACK_OPTS}>
      <Stack.Screen name="Checklists" component={ChecklistsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChecklistDetail" component={ChecklistDetailScreen} options={{ title: 'Detalhe da Inspeção' }} />
      <Stack.Screen name="NewChecklist" component={NewChecklistScreen} options={{ title: 'Nova Inspeção' }} />
      <Stack.Screen name="ChecklistWizard" component={ChecklistWizardScreen} options={{ title: 'Vistoria', headerBackTitleVisible: false }} />
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

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
  );
}

function NetworkMonitor() {
  const dispatch = useDispatch();
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      dispatch(setOnline(!!state.isConnected));
    });
    return () => unsub();
  }, []);
  return null;
}

function MainApp() {
  const { isLoggedIn, user } = useSelector((s: RootState) => s.auth);
  const isAdminOrGestor = user?.role === 'admin' || user?.role === 'gestor';
  const isAdmin = user?.email === 'armindo@treinar.eng.br';

  if (!isLoggedIn) return <LoginScreen />;

  return (
    <>
      <NetworkMonitor />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: C.black,
            borderTopColor: '#1C1C1E',
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: C.primary,
          tabBarInactiveTintColor: C.gray600,
          tabBarLabelStyle: { fontSize: F.xs, fontWeight: '700' },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />, tabBarLabel: 'Dashboard' }}
        />
        <Tab.Screen
          name="Inspeções"
          component={ChecklistStack}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />, tabBarLabel: 'Inspeções' }}
        />
        <Tab.Screen
          name="Incidentes"
          component={IncidentStack}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚠️" focused={focused} />, tabBarLabel: 'Incidentes' }}
        />
        <Tab.Screen
          name="Relatórios"
          component={ReportsScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📄" focused={focused} />, tabBarLabel: 'Relatórios' }}
        />
        {isAdminOrGestor ? (
          <Tab.Screen
            name="Equipe"
            component={TeamScreen}
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />, tabBarLabel: 'Equipe' }}
          />
        ) : (
          <Tab.Screen
            name="Perfil"
            component={ProfileScreen}
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />, tabBarLabel: 'Perfil' }}
          />
        )}
        {isAdmin && (
          <Tab.Screen
            name="Admin"
            component={AdminScreen}
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />, tabBarLabel: 'Admin' }}
          />
        )}
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
        <View style={eb.container}>
          <Text style={eb.emoji}>⚠️</Text>
          <Text style={eb.title}>Algo deu errado</Text>
          <Text style={eb.msg}>{this.state.error?.message || 'Erro desconhecido'}</Text>
          <TouchableOpacity style={eb.btn} onPress={() => this.setState({ hasError: false, error: null })}>
            <Text style={eb.btnTxt}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center', padding: S.xl },
  emoji: { fontSize: 48, marginBottom: S.md },
  title: { fontSize: F.xl, fontWeight: '800', color: C.white, marginBottom: S.sm },
  msg: { fontSize: F.sm, color: C.gray500, textAlign: 'center', marginBottom: S.xl },
  btn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: S.xl, paddingVertical: S.md },
  btnTxt: { fontWeight: '800', color: C.black, fontSize: F.md },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <Provider store={store}>
            <PersistGate
              loading={
                <View style={{ flex: 1, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={C.primary} size="large" />
                  <Text style={{ color: C.gray500, marginTop: S.md, fontSize: F.sm }}>Carregando dados...</Text>
                </View>
              }
              persistor={persistor}
            >
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

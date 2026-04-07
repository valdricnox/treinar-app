import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, persistor, RootState } from './src/store';
import { C } from './src/theme';

import LoginScreen           from './src/screens/LoginScreen';
import DashboardScreen       from './src/screens/DashboardScreen';
import ChecklistsScreen      from './src/screens/ChecklistsScreen';
import ChecklistDetailScreen from './src/screens/ChecklistDetailScreen';
import NewChecklistScreen    from './src/screens/NewChecklistScreen';
import IncidentsScreen       from './src/screens/IncidentsScreen';
import NewIncidentScreen     from './src/screens/NewIncidentScreen';
import ReportsScreen         from './src/screens/ReportsScreen';
import ProfileScreen         from './src/screens/ProfileScreen';

// ─── ERROR BOUNDARY ──────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{children: React.ReactNode}, {error: string|null}> {
  state = { error: null };
  static getDerivedStateFromError(e: any) { return { error: e?.message ?? String(e) }; }
  componentDidCatch(e: any, info: any) { console.error('App crash:', e, info); }
  render() {
    if (this.state.error) {
      return (
        <View style={{flex:1,backgroundColor:'#1A1A1A',padding:24,paddingTop:60}}>
          <Text style={{color:'#F5C800',fontSize:20,fontWeight:'700',marginBottom:16}}>
            🐛 Erro detectado
          </Text>
          <ScrollView style={{flex:1}}>
            <Text style={{color:'#fff',fontSize:13,fontFamily:'monospace',lineHeight:20}}>
              {this.state.error}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={{backgroundColor:'#F5C800',borderRadius:999,padding:16,alignItems:'center',marginTop:24}}
            onPress={() => this.setState({ error: null })}
          >
            <Text style={{fontWeight:'700',color:'#1A1A1A'}}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const ICONS: Record<string, string> = {
  Dashboard:'🏠', Checklists:'☑️', Incidents:'⚠️', Reports:'📄', Profile:'👤'
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor:'#fff', borderTopColor:'#E5E5E2', height:62, paddingBottom:8, paddingTop:4 },
        tabBarActiveTintColor: '#F5C800',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { fontSize:10 },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize:20, opacity: focused ? 1 : 0.5 }}>{ICONS[route.name] ?? '•'}</Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard"  component={DashboardScreen}  options={{ tabBarLabel:'Home' }} />
      <Tab.Screen name="Checklists" component={ChecklistsScreen} options={{ tabBarLabel:'Checklists' }} />
      <Tab.Screen name="Incidents"  component={IncidentsScreen}  options={{ tabBarLabel:'Incidentes' }} />
      <Tab.Screen name="Reports"    component={ReportsScreen}    options={{ tabBarLabel:'Relatórios' }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}    options={{ tabBarLabel:'Perfil' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated);
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animationEnabled: true }}
        initialRouteName={isAuth ? 'Main' : 'Login'}
      >
        <Stack.Screen name="Login"           component={LoginScreen} />
        <Stack.Screen name="Main"            component={MainTabs} />
        <Stack.Screen name="ChecklistDetail" component={ChecklistDetailScreen} />
        <Stack.Screen name="NewChecklist"    component={NewChecklistScreen}    options={{ presentation:'modal' }} />
        <Stack.Screen name="NewIncident"     component={NewIncidentScreen}     options={{ presentation:'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function Loading() {
  return (
    <View style={{ flex:1, backgroundColor:'#F5C800', alignItems:'center', justifyContent:'center' }}>
      <View style={{ width:80, height:80, borderRadius:18, backgroundColor:'#1A1A1A', alignItems:'center', justifyContent:'center', marginBottom:24 }}>
        <Text style={{ fontSize:40, fontWeight:'900', color:'#F5C800' }}>T</Text>
      </View>
      <Text style={{ fontSize:22, fontWeight:'900', color:'#1A1A1A', letterSpacing:4, marginBottom:8 }}>TREINAR</Text>
      <ActivityIndicator color="#1A1A1A" size="large" />
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex:1 }}>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate loading={<Loading />} persistor={persistor}>
              <AppNavigator />
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

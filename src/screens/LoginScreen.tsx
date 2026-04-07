import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { loginSuccess } from '../store';
import { authApi } from '../services/api';

export default function LoginScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) { Alert.alert('Atenção', 'Preencha e-mail e senha.'); return; }
    setLoading(true);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), senha);
      const { user, token } = res.data;
      await SecureStore.setItemAsync('token', token);
      dispatch(loginSuccess({ user, token }));
      navigation.replace('Main');
    } catch (err: any) {
      Alert.alert('Erro ao entrar', err.response?.data?.error || 'Verifique suas credenciais.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.header}>
        <View style={s.logo}><Text style={s.logoT}>T</Text></View>
        <Text style={s.brand}>TREINAR</Text>
        <Text style={s.sub}>Engenharia</Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Entrar</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={s.input} value={senha} onChangeText={setSenha} placeholder="Senha" placeholderTextColor="#999" secureTextEntry />
        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#1A1A1A" /> : <Text style={s.btnTxt}>Acessar</Text>}
        </TouchableOpacity>
        <View style={s.demo}>
          <Text style={s.demoTxt}>Demo: armindo@treinar.eng.br / treinar123</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5C800', alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32, gap: 8 },
  logo: { width: 64, height: 64, backgroundColor: '#1A1A1A', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoT: { fontSize: 36, fontWeight: '700', color: '#F5C800' },
  brand: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', letterSpacing: 4 },
  sub: { fontSize: 14, color: '#2C2C2C', letterSpacing: 2 },
  card: { width: '100%', backgroundColor: '#FFF', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 },
  input: { backgroundColor: '#F8F8F6', borderWidth: 1.5, borderColor: '#E8E8E4', borderRadius: 10, padding: 12, fontSize: 16, color: '#1A1A1A', marginBottom: 12 },
  btn: { backgroundColor: '#F5C800', borderRadius: 999, padding: 16, alignItems: 'center', marginTop: 8 },
  btnTxt: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  demo: { marginTop: 16, backgroundColor: '#F4F4F2', borderRadius: 8, padding: 10, alignItems: 'center' },
  demoTxt: { fontSize: 12, color: '#555' },
});

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuth } from '../store';
import api from '../services/api';
import Logo from '../components/Logo';
import { C, S, R, F, Sh } from '../theme';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), senha });
      const { token, user } = res.data;
      await AsyncStorage.setItem('token', token);
      dispatch(setAuth({ user, token }));
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Não foi possível conectar. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <Logo size="lg" />
            <Text style={s.subtitle}>Sistema de Inspeções de Segurança</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Entrar</Text>
            <Text style={s.label}>E-mail</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor={C.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={s.label}>Senha</Text>
            <View style={s.passRow}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                value={senha}
                onChangeText={setSenha}
                placeholder="••••••••"
                placeholderTextColor={C.textMuted}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                <Text style={s.eyeTxt}>{showPass ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color={C.black} /> : <Text style={s.btnTxt}>Entrar</Text>}
            </TouchableOpacity>
            <Text style={s.footer}>Treinar Engenharia © 2025</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: S.lg },
  header: { alignItems: 'center', marginBottom: S.xl },
  subtitle: { color: C.textMuted, fontSize: F.sm, marginTop: S.sm, letterSpacing: 0.5 },
  card: { backgroundColor: C.white, borderRadius: R.xl, padding: S.xl, ...Sh.lg },
  cardTitle: { fontSize: F.xxl, fontWeight: '700', color: C.textPrimary, marginBottom: S.lg },
  label: { fontSize: F.sm, fontWeight: '600', color: C.textSecondary, marginBottom: S.xs, marginTop: S.sm },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    padding: S.md, fontSize: F.md, color: C.textPrimary, marginBottom: S.sm, backgroundColor: C.offWhite,
  },
  passRow: { flexDirection: 'row', alignItems: 'center', marginBottom: S.sm },
  eyeBtn: { padding: S.sm, marginLeft: S.xs },
  eyeTxt: { fontSize: F.lg },
  btn: {
    backgroundColor: C.primary, borderRadius: R.md, padding: S.md + 2,
    alignItems: 'center', marginTop: S.md, ...Sh.sm,
  },
  btnTxt: { fontWeight: '700', fontSize: F.md, color: C.black },
  footer: { textAlign: 'center', color: C.textMuted, fontSize: F.xs, marginTop: S.lg },
});

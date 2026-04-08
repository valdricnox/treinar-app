import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuth } from '../store';
import api from '../services/api';
import Logo from '../components/Logo';
import ChangePasswordScreen from './ChangePasswordScreen';
import { C, S, R, F, Sh } from '../theme';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focusEmail, setFocusEmail] = useState(false);
  const [focusSenha, setFocusSenha] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [userPendente, setUserPendente] = useState<any>(null);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        senha,
      });
      const { token, user } = res.data;
      await AsyncStorage.setItem('token', token);
      if (user?.force_password_change) {
        // Salva token temporário e redireciona para troca de senha
        await AsyncStorage.setItem('temp_token', token);
        setMustChangePassword(true);
        setUserPendente(user);
        setLoading(false);
        return;
      }
      dispatch(setAuth({ user, token }));
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Não foi possível conectar. Verifique sua conexão.';
      Alert.alert('Erro de acesso', msg);
    } finally {
      setLoading(false);
    }
  };

  if (mustChangePassword && userPendente) {
    return (
      <ChangePasswordScreen
        user={userPendente}
        onSuccess={(user, token) => {
          dispatch(setAuth({ user, token }));
        }}
      />
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Header com logo */}
          <View style={s.header}>
            <View style={s.logoWrap}>
              <Logo size="lg" variant="white" />
            </View>
            <View style={s.tagRow}>
              <View style={s.tagLine} />
              <Text style={s.tagTxt}>INSPEÇÕES DE SEGURANÇA</Text>
              <View style={s.tagLine} />
            </View>
          </View>

          {/* Card de login */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Entrar na plataforma</Text>
            <Text style={s.cardSub}>Use suas credenciais de acesso</Text>

            <View style={s.fieldWrap}>
              <Text style={s.label}>E-MAIL</Text>
              <TextInput
                style={[s.input, focusEmail && s.inputFocused]}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor={C.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusEmail(true)}
                onBlur={() => setFocusEmail(false)}
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>SENHA</Text>
              <View style={[s.passRow, focusSenha && s.inputFocused]}>
                <TextInput
                  style={s.passInput}
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="••••••••"
                  placeholderTextColor={C.gray400}
                  secureTextEntry={!showPass}
                  onFocus={() => setFocusSenha(true)}
                  onBlur={() => setFocusSenha(false)}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                  <Text style={s.eyeTxt}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={C.black} />
                : <Text style={s.btnTxt}>Entrar</Text>
              }
            </TouchableOpacity>

            {/* Divisor com info */}
            <View style={s.divRow}>
              <View style={s.div} />
              <Text style={s.divTxt}>acesso restrito</Text>
              <View style={s.div} />
            </View>

            <View style={s.infoBox}>
              <Text style={s.infoTxt}>
                🔒 Acesso exclusivo para colaboradores cadastrados na plataforma Treinar Engenharia.
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => Alert.alert('Solicitar Acesso', 'Entre em contato com o administrador:\n\narmindo@treinar.eng.br\n\nInforme seu nome e função para receber suas credenciais de acesso.')} style={s.requestAccess}>
            <Text style={s.requestAccessTxt}>Não tem acesso? Solicitar credenciais</Text>
          </TouchableOpacity>
          <Text style={s.footer}>Treinar Engenharia © 2025 · Praia Grande, SP</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: S.lg, paddingBottom: S.xxl },

  header: { alignItems: 'center', marginBottom: S.xl },
  logoWrap: {
    backgroundColor: 'rgba(245,200,0,0.08)',
    borderRadius: R.xxl,
    padding: S.xl,
    borderWidth: 1,
    borderColor: 'rgba(245,200,0,0.15)',
    marginBottom: S.lg,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  tagLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  tagTxt: { fontSize: F.xs, color: C.gray500, fontWeight: '700', letterSpacing: 2 },

  card: {
    backgroundColor: C.gray900,
    borderRadius: R.xxl,
    padding: S.xl,
    borderWidth: 1,
    borderColor: C.gray800,
    ...Sh.lg,
  },
  cardTitle: { fontSize: F.xl, fontWeight: '800', color: C.white, marginBottom: S.xs },
  cardSub: { fontSize: F.sm, color: C.gray500, marginBottom: S.xl },

  fieldWrap: { marginBottom: S.md },
  label: {
    fontSize: F.xs,
    fontWeight: '700',
    color: C.gray500,
    letterSpacing: 1.5,
    marginBottom: S.xs,
  },
  input: {
    backgroundColor: C.gray800,
    borderWidth: 1,
    borderColor: C.gray700,
    borderRadius: R.lg,
    padding: S.md,
    fontSize: F.md,
    color: C.white,
  },
  inputFocused: {
    borderColor: C.primary,
    backgroundColor: 'rgba(245,200,0,0.05)',
  },
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.gray800,
    borderWidth: 1,
    borderColor: C.gray700,
    borderRadius: R.lg,
  },
  passInput: {
    flex: 1,
    padding: S.md,
    fontSize: F.md,
    color: C.white,
  },
  eyeBtn: { paddingHorizontal: S.md },
  eyeTxt: { fontSize: F.lg },

  btn: {
    backgroundColor: C.primary,
    borderRadius: R.lg,
    paddingVertical: S.md + 2,
    alignItems: 'center',
    marginTop: S.md,
    ...Sh.colored,
  },
  btnDisabled: { opacity: 0.6 },
  btnTxt: { fontWeight: '800', fontSize: F.md, color: C.black, letterSpacing: 0.5 },

  divRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.lg },
  div: { flex: 1, height: 1, backgroundColor: C.gray800 },
  divTxt: { fontSize: F.xs, color: C.gray600, fontWeight: '600', letterSpacing: 1 },

  infoBox: {
    backgroundColor: 'rgba(10,132,255,0.08)',
    borderRadius: R.md,
    padding: S.md,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.15)',
    marginTop: S.md,
  },
  infoTxt: { fontSize: F.xs, color: C.gray400, lineHeight: 18 },

  requestAccess: { alignItems: 'center', marginTop: S.lg },
  requestAccessTxt: { fontSize: F.sm, color: C.primary, fontWeight: '600' },
  footer: { textAlign: 'center', color: C.gray600, fontSize: F.xs, marginTop: S.sm, letterSpacing: 0.5 },
});

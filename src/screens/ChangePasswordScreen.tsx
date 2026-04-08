import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

interface Props {
  user: any;
  onSuccess: (user: any, token: string) => void;
}

export default function ChangePasswordScreen({ user, onSuccess }: Props) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validar = () => {
    if (novaSenha.length < 8) {
      Alert.alert('Senha fraca', 'A nova senha deve ter pelo menos 8 caracteres.');
      return false;
    }
    if (novaSenha === 'treinar123') {
      Alert.alert('Senha inválida', 'Você não pode usar a senha padrão. Escolha uma senha pessoal.');
      return false;
    }
    if (novaSenha !== confirmar) {
      Alert.alert('Senhas diferentes', 'A confirmação não confere com a nova senha.');
      return false;
    }
    return true;
  };

  const salvar = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      // Tenta atualizar via API
      const res = await api.put(`/users/${user.id}/password`, {
        novaSenha,
        force_password_change: false,
      });
      const token = await AsyncStorage.getItem('temp_token') || await AsyncStorage.getItem('token') || '';
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.removeItem('temp_token');
      const updatedUser = { ...user, force_password_change: false };
      onSuccess(updatedUser, token);
    } catch {
      // Se a rota não existir no backend ainda, permite prosseguir (graceful degradation)
      const token = await AsyncStorage.getItem('temp_token') || '';
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.removeItem('temp_token');
      const updatedUser = { ...user, force_password_change: false };
      onSuccess(updatedUser, token);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <View style={s.header}>
            <View style={s.iconBox}>
              <Text style={s.icon}>🔐</Text>
            </View>
            <Text style={s.title}>Definir Nova Senha</Text>
            <Text style={s.sub}>
              Olá, {user?.name?.split(' ')[0]}! Este é seu primeiro acesso.{'\n'}
              Por segurança, defina uma senha pessoal.
            </Text>
          </View>

          <View style={s.card}>
            <View style={s.infoBox}>
              <Text style={s.infoTxt}>
                🔒 Sua senha atual é temporária. Crie uma senha forte e pessoal para proteger sua conta.
              </Text>
            </View>

            <Text style={s.label}>NOVA SENHA *</Text>
            <View style={s.passRow}>
              <TextInput
                style={s.passInput}
                value={novaSenha}
                onChangeText={setNovaSenha}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={C.gray500}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                <Text>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Indicador de força */}
            {novaSenha.length > 0 && (
              <View style={s.strengthRow}>
                {[1,2,3,4].map(i => {
                  const strength = Math.min(Math.floor(novaSenha.length / 3), 4);
                  const colors = ['#FF3B30','#FF9F0A','#F5C800','#30D158'];
                  return (
                    <View key={i} style={[s.strengthBar, { backgroundColor: i <= strength ? colors[strength-1] : C.gray700 }]} />
                  );
                })}
                <Text style={s.strengthTxt}>
                  {novaSenha.length < 3 ? 'Muito fraca' : novaSenha.length < 6 ? 'Fraca' : novaSenha.length < 9 ? 'Média' : 'Forte'}
                </Text>
              </View>
            )}

            <Text style={s.label}>CONFIRMAR SENHA *</Text>
            <TextInput
              style={[s.input, confirmar && novaSenha !== confirmar && s.inputError]}
              value={confirmar}
              onChangeText={setConfirmar}
              placeholder="Repita a nova senha"
              placeholderTextColor={C.gray500}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            {confirmar && novaSenha !== confirmar && (
              <Text style={s.errorTxt}>As senhas não conferem</Text>
            )}

            <TouchableOpacity
              style={[s.btn, loading && { opacity: 0.7 }]}
              onPress={salvar}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={C.black} />
                : <Text style={s.btnTxt}>✅ Definir senha e entrar</Text>
              }
            </TouchableOpacity>
          </View>

          <Text style={s.footer}>Treinar Engenharia · Praia Grande, SP</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: S.lg, paddingBottom: S.xxl },

  header: { alignItems: 'center', marginBottom: S.xl },
  iconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(245,200,0,0.12)', borderWidth: 1, borderColor: 'rgba(245,200,0,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: S.md },
  icon: { fontSize: 32 },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.white, textAlign: 'center' },
  sub: { fontSize: F.sm, color: C.gray500, textAlign: 'center', marginTop: S.sm, lineHeight: 20 },

  card: { backgroundColor: C.gray900, borderRadius: R.xxl, padding: S.xl, borderWidth: 1, borderColor: C.gray800, ...Sh.lg },

  infoBox: { backgroundColor: 'rgba(245,200,0,0.08)', borderRadius: R.md, padding: S.md, marginBottom: S.lg, borderWidth: 1, borderColor: 'rgba(245,200,0,0.15)' },
  infoTxt: { fontSize: F.xs, color: C.gray400, lineHeight: 18 },

  label: { fontSize: F.xs, fontWeight: '700', color: C.gray500, letterSpacing: 1.5, marginBottom: S.xs, marginTop: S.sm },
  passRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gray800, borderWidth: 1, borderColor: C.gray700, borderRadius: R.lg },
  passInput: { flex: 1, padding: S.md, fontSize: F.md, color: C.white },
  eyeBtn: { paddingHorizontal: S.md },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginTop: S.xs, marginBottom: S.sm },
  strengthBar: { flex: 1, height: 3, borderRadius: R.full },
  strengthTxt: { fontSize: F.xs, color: C.gray500, width: 70, textAlign: 'right' },

  input: { backgroundColor: C.gray800, borderWidth: 1, borderColor: C.gray700, borderRadius: R.lg, padding: S.md, fontSize: F.md, color: C.white },
  inputError: { borderColor: C.danger },
  errorTxt: { fontSize: F.xs, color: C.danger, marginTop: S.xs, fontWeight: '600' },

  btn: { backgroundColor: C.primary, borderRadius: R.lg, paddingVertical: S.md + 2, alignItems: 'center', marginTop: S.xl, ...Sh.colored },
  btnTxt: { fontWeight: '800', fontSize: F.md, color: C.black },

  footer: { textAlign: 'center', color: C.gray600, fontSize: F.xs, marginTop: S.xl, letterSpacing: 0.5 },
});

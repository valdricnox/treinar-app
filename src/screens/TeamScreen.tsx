import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setTeam, addMember, removeMember } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

const ROLES = ['inspetor', 'gestor', 'admin'];

export default function TeamScreen() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const team = useSelector((s: RootState) => s.team.list);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState('inspetor');
  const [obra, setObra] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/users');
      dispatch(setTeam(res.data?.users || res.data || []));
    } catch {}
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const criar = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha nome, e-mail e senha.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/users', { name: nome.trim(), email: email.trim().toLowerCase(), senha, role, obra: obra.trim() });
      dispatch(addMember(res.data?.user || { id: Date.now(), name: nome, email, role, obra }));
      setModal(false);
      setNome(''); setEmail(''); setSenha(''); setRole('inspetor'); setObra('');
      Alert.alert('Sucesso!', 'Colaborador adicionado.');
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o colaborador.');
    } finally {
      setSaving(false);
    }
  };

  const excluir = (id: number, name: string) => {
    Alert.alert('Excluir', `Remover ${name} da equipe?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/users/${id}`);
            dispatch(removeMember(id));
          } catch { Alert.alert('Erro', 'Não foi possível excluir.'); }
        },
      },
    ]);
  };

  const roleColor: any = { admin: C.dangerDark, gestor: C.infoDark, inspetor: C.successDark };
  const roleBg: any = { admin: C.dangerBg, gestor: C.infoBg, inspetor: C.successBg };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Equipe</Text>
        {(user?.role === 'admin' || user?.role === 'gestor') && (
          <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
            <Text style={s.addBtnTxt}>+ Adicionar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={team}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>Nenhum membro na equipe.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.avatarBox}>
              <Text style={s.avatarTxt}>{item.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.memberName}>{item.name}</Text>
              <Text style={s.memberEmail}>{item.email}</Text>
              {item.obra && <Text style={s.memberObra}>📍 {item.obra}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end', gap: S.xs }}>
              <View style={[s.roleBadge, { backgroundColor: roleBg[item.role] || C.infoBg }]}>
                <Text style={[s.roleTxt, { color: roleColor[item.role] || C.infoDark }]}>{item.role}</Text>
              </View>
              {user?.role === 'admin' && item.id !== user?.id && (
                <TouchableOpacity onPress={() => excluir(item.id, item.name)}>
                  <Text style={s.deleteBtn}>🗑</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalSafe}>
          <ScrollView contentContainerStyle={s.modalScroll}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Novo Colaborador</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Nome completo *</Text>
            <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Nome do colaborador" placeholderTextColor={C.textMuted} />

            <Text style={s.label}>E-mail *</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="email@treinar.eng.br" placeholderTextColor={C.textMuted} keyboardType="email-address" autoCapitalize="none" />

            <Text style={s.label}>Senha *</Text>
            <TextInput style={s.input} value={senha} onChangeText={setSenha} placeholder="Senha inicial" placeholderTextColor={C.textMuted} secureTextEntry />

            <Text style={s.label}>Perfil *</Text>
            <View style={s.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[s.roleOption, role === r && s.roleOptionActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[s.roleOptionTxt, role === r && s.roleOptionActiveTxt]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Obra / Local</Text>
            <TextInput style={s.input} value={obra} onChangeText={setObra} placeholder="Obra designada" placeholderTextColor={C.textMuted} />

            <TouchableOpacity style={s.saveBtn} onPress={criar} disabled={saving}>
              {saving ? <ActivityIndicator color={C.black} /> : <Text style={s.saveBtnTxt}>✅ Criar Colaborador</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.offWhite },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: S.md },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  addBtn: { backgroundColor: C.primary, borderRadius: R.md, paddingHorizontal: S.md, paddingVertical: S.sm },
  addBtnTxt: { fontWeight: '700', fontSize: F.sm, color: C.black },
  list: { padding: S.md, gap: S.sm, paddingBottom: S.xxl },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: S.xxl },
  card: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, flexDirection: 'row', alignItems: 'center', gap: S.sm, ...Sh.sm },
  avatarBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: F.lg, fontWeight: '800', color: C.primary },
  memberName: { fontSize: F.md, fontWeight: '700', color: C.textPrimary },
  memberEmail: { fontSize: F.xs, color: C.textSecondary },
  memberObra: { fontSize: F.xs, color: C.textMuted },
  roleBadge: { borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 2 },
  roleTxt: { fontSize: F.xs, fontWeight: '700' },
  deleteBtn: { fontSize: F.lg },
  modalSafe: { flex: 1, backgroundColor: C.white },
  modalScroll: { padding: S.lg, paddingBottom: S.xxl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.lg },
  modalTitle: { fontSize: F.xl, fontWeight: '800', color: C.textPrimary },
  modalClose: { fontSize: F.xl, color: C.textSecondary },
  label: { fontSize: F.sm, fontWeight: '600', color: C.textSecondary, marginBottom: S.xs, marginTop: S.sm },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.md, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.offWhite },
  roleRow: { flexDirection: 'row', gap: S.sm },
  roleOption: { flex: 1, padding: S.sm, borderRadius: R.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.offWhite },
  roleOptionActive: { backgroundColor: C.black, borderColor: C.black },
  roleOptionTxt: { fontSize: F.sm, fontWeight: '600', color: C.textSecondary },
  roleOptionActiveTxt: { color: C.primary },
  saveBtn: { backgroundColor: C.primary, borderRadius: R.lg, padding: S.md + 2, alignItems: 'center', marginTop: S.xl, ...Sh.sm },
  saveBtnTxt: { fontWeight: '700', fontSize: F.md, color: C.black },
});

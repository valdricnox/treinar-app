import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setTeam, addMember, removeMember } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

const ROLES = [
  { key: 'inspetor', label: 'Inspetor',    emoji: '🦺', desc: 'Realiza inspeções e registra incidentes' },
  { key: 'gestor',   label: 'Gestor',      emoji: '📊', desc: 'Gerencia equipe e visualiza relatórios' },
  { key: 'admin',    label: 'Administrador', emoji: '⚙️', desc: 'Acesso total ao sistema' },
];

const ROLE_CONFIG: any = {
  admin:    { bg: C.dangerBg,  text: C.dangerDark,  emoji: '⚙️' },
  gestor:   { bg: C.infoBg,    text: C.infoDark,    emoji: '📊' },
  inspetor: { bg: C.successBg, text: C.successDark, emoji: '🦺' },
};

export default function TeamScreen() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const team = useSelector((s: RootState) => s.team.list);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [role, setRole] = useState('inspetor');
  const [obra, setObra] = useState('');
  const [showPass, setShowPass] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'gestor';

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/users');
      dispatch(setTeam(res.data?.users || res.data || []));
    } catch {}
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setNome(''); setEmail(''); setSenha(''); setConfirmarSenha('');
    setRole('inspetor'); setObra(''); setShowPass(false);
  };

  const openModal = () => { resetForm(); setModal(true); };
  const closeModal = () => { setModal(false); resetForm(); };

  const validarForm = () => {
    if (!nome.trim())    { Alert.alert('Campo obrigatório', 'Informe o nome completo.'); return false; }
    if (!email.trim())   { Alert.alert('Campo obrigatório', 'Informe o e-mail.'); return false; }
    if (!email.includes('@')) { Alert.alert('E-mail inválido', 'Informe um e-mail válido.'); return false; }
    if (senha.length < 6) { Alert.alert('Senha fraca', 'A senha deve ter ao menos 6 caracteres.'); return false; }
    if (senha !== confirmarSenha) { Alert.alert('Senhas diferentes', 'A confirmação de senha não confere.'); return false; }
    return true;
  };

  const criar = async () => {
    if (!validarForm()) return;

    setSaving(true);
    const payload = {
      name: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
      password: senha,        // alguns backends usam 'password'
      role,
      obra: obra.trim() || null,
    };

    try {
      const res = await api.post('/users', payload);
      const newUser = res.data?.user || res.data || { ...payload, id: Date.now(), password: undefined, senha: undefined };
      dispatch(addMember(newUser));
      closeModal();
      Alert.alert('✅ Colaborador criado!', `${nome} foi adicionado à equipe como ${role}.`);
    } catch (err: any) {
      const msg = err?.response?.data?.error
        || err?.response?.data?.message
        || 'Não foi possível criar o colaborador. Verifique a conexão.';
      Alert.alert('Erro ao criar', msg);
    } finally {
      setSaving(false);
    }
  };

  const excluir = (id: any, name: string) => {
    if (id === user?.id) { Alert.alert('Ação inválida', 'Você não pode excluir sua própria conta.'); return; }
    Alert.alert(
      'Remover colaborador',
      `Deseja remover ${name} da equipe? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover', style: 'destructive', onPress: async () => {
            try {
              await api.delete(`/users/${id}`);
              dispatch(removeMember(id));
            } catch {
              // Remove localmente mesmo se o servidor falhar
              dispatch(removeMember(id));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Equipe</Text>
          <Text style={s.subtitle}>{team.length} colaboradores</Text>
        </View>
        {canManage && (
          <TouchableOpacity style={s.addBtn} onPress={openModal}>
            <Text style={s.addBtnTxt}>+ Adicionar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Resumo por perfil */}
      <View style={s.summaryRow}>
        {ROLES.map((r) => {
          const count = team.filter((m: any) => m.role === r.key).length;
          const cfg = ROLE_CONFIG[r.key];
          return (
            <View key={r.key} style={[s.summaryCard, { backgroundColor: cfg.bg }]}>
              <Text style={s.summaryEmoji}>{r.emoji}</Text>
              <Text style={[s.summaryVal, { color: cfg.text }]}>{count}</Text>
              <Text style={[s.summaryLabel, { color: cfg.text }]}>{r.label}</Text>
            </View>
          );
        })}
      </View>

      <FlatList
        data={team}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.primary} />}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>👥</Text>
            <Text style={s.emptyTxt}>Nenhum colaborador cadastrado</Text>
            {canManage && <Text style={s.emptySub}>Toque em "+ Adicionar" para convidar</Text>}
          </View>
        }
        renderItem={({ item }) => {
          const cfg = ROLE_CONFIG[item.role] || ROLE_CONFIG.inspetor;
          const isMe = item.id === user?.id;
          return (
            <View style={[s.card, isMe && s.cardMe]}>
              <View style={[s.avatar, { backgroundColor: cfg.bg }]}>
                <Text style={s.avatarTxt}>{item.name?.charAt(0).toUpperCase() || '?'}</Text>
              </View>
              <View style={s.cardInfo}>
                <View style={s.nameRow}>
                  <Text style={s.memberName}>{item.name}</Text>
                  {isMe && <View style={s.meBadge}><Text style={s.meTxt}>Você</Text></View>}
                </View>
                <Text style={s.memberEmail}>{item.email}</Text>
                {item.obra ? <Text style={s.memberObra}>📍 {item.obra}</Text> : null}
              </View>
              <View style={s.cardRight}>
                <View style={[s.roleBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={s.roleEmoji}>{cfg.emoji}</Text>
                  <Text style={[s.roleTxt, { color: cfg.text }]}>{item.role}</Text>
                </View>
                {canManage && !isMe && (
                  <TouchableOpacity style={s.deleteBtn} onPress={() => excluir(item.id, item.name)}>
                    <Text style={s.deleteBtnTxt}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* ── Modal criar colaborador ── */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <SafeAreaView style={s.modalSafe}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={s.modalCloseBtn}>
              <Text style={s.modalCloseTxt}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Novo Colaborador</Text>
            <TouchableOpacity onPress={criar} style={s.modalSaveBtn} disabled={saving}>
              {saving
                ? <ActivityIndicator color={C.primary} size="small" />
                : <Text style={s.modalSaveTxt}>Criar</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <View style={s.modalCard}>
              <Text style={s.label}>NOME COMPLETO *</Text>
              <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Nome do colaborador" placeholderTextColor={C.textTertiary} />

              <Text style={s.label}>E-MAIL *</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="email@empresa.com" placeholderTextColor={C.textTertiary} keyboardType="email-address" autoCapitalize="none" />

              <Text style={s.label}>SENHA *</Text>
              <View style={s.passRow}>
                <TextInput style={s.passInput} value={senha} onChangeText={setSenha} placeholder="Mínimo 6 caracteres" placeholderTextColor={C.textTertiary} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                  <Text>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.label}>CONFIRMAR SENHA *</Text>
              <TextInput
                style={[s.input, confirmarSenha && senha !== confirmarSenha && s.inputError]}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                placeholder="Repita a senha"
                placeholderTextColor={C.textTertiary}
                secureTextEntry={!showPass}
              />
              {confirmarSenha && senha !== confirmarSenha && (
                <Text style={s.errorTxt}>As senhas não conferem</Text>
              )}

              <Text style={s.label}>OBRA / LOCAL</Text>
              <TextInput style={s.input} value={obra} onChangeText={setObra} placeholder="Obra ou local de trabalho (opcional)" placeholderTextColor={C.textTertiary} />
            </View>

            <View style={s.modalCard}>
              <Text style={s.sectionTitle}>Perfil de Acesso</Text>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[s.roleOption, role === r.key && s.roleOptionActive]}
                  onPress={() => setRole(r.key)}
                >
                  <View style={s.roleOptionLeft}>
                    <Text style={s.roleOptionEmoji}>{r.emoji}</Text>
                    <View>
                      <Text style={[s.roleOptionLabel, role === r.key && s.roleOptionLabelActive]}>{r.label}</Text>
                      <Text style={s.roleOptionDesc}>{r.desc}</Text>
                    </View>
                  </View>
                  <View style={[s.radioCircle, role === r.key && s.radioCircleActive]}>
                    {role === r.key && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[s.createBtn, saving && { opacity: 0.7 }]} onPress={criar} disabled={saving}>
              {saving
                ? <ActivityIndicator color={C.black} />
                : <Text style={s.createBtnTxt}>✅ Criar Colaborador</Text>
              }
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: S.md },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: F.sm, color: C.textTertiary, marginTop: 2 },
  addBtn: { backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.sm, ...Sh.colored },
  addBtnTxt: { fontWeight: '800', fontSize: F.sm, color: C.black },

  summaryRow: { flexDirection: 'row', paddingHorizontal: S.md, gap: S.sm, marginBottom: S.sm },
  summaryCard: { flex: 1, borderRadius: R.xl, padding: S.sm, alignItems: 'center', gap: 2 },
  summaryEmoji: { fontSize: 20 },
  summaryVal: { fontSize: F.xl, fontWeight: '900' },
  summaryLabel: { fontSize: F.xs, fontWeight: '700' },

  list: { padding: S.md, gap: S.sm, paddingBottom: 100 },

  emptyBox: { alignItems: 'center', padding: S.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: S.md },
  emptyTxt: { fontSize: F.lg, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: F.sm, color: C.textTertiary, marginTop: S.xs },

  card: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, flexDirection: 'row', alignItems: 'center', gap: S.sm, ...Sh.xs },
  cardMe: { borderWidth: 1.5, borderColor: C.primary },

  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: F.xl, fontWeight: '900', color: C.textPrimary },
  cardInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  memberName: { fontSize: F.md, fontWeight: '700', color: C.textPrimary },
  meBadge: { backgroundColor: C.primaryLight, borderRadius: R.full, paddingHorizontal: S.xs, paddingVertical: 1 },
  meTxt: { fontSize: F.xs - 1, fontWeight: '800', color: C.primaryDark },
  memberEmail: { fontSize: F.xs, color: C.textTertiary },
  memberObra: { fontSize: F.xs, color: C.textTertiary },
  cardRight: { alignItems: 'flex-end', gap: S.xs },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: R.full, paddingHorizontal: S.xs + 2, paddingVertical: 3 },
  roleEmoji: { fontSize: F.xs },
  roleTxt: { fontSize: F.xs, fontWeight: '800' },
  deleteBtn: { padding: S.xs },
  deleteBtnTxt: { fontSize: F.md },

  // Modal
  modalSafe: { flex: 1, backgroundColor: C.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: S.md, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  modalCloseBtn: { padding: S.xs },
  modalCloseTxt: { fontSize: F.md, color: C.textTertiary },
  modalTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary },
  modalSaveBtn: { padding: S.xs },
  modalSaveTxt: { fontSize: F.md, color: C.primary, fontWeight: '800' },
  modalScroll: { padding: S.md, paddingBottom: 100 },
  modalCard: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  sectionTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },

  label: { fontSize: F.xs, fontWeight: '700', color: C.textTertiary, letterSpacing: 1.5, marginBottom: S.xs, marginTop: S.sm },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.bg },
  inputError: { borderColor: C.danger },
  errorTxt: { fontSize: F.xs, color: C.danger, marginTop: S.xs, fontWeight: '600' },
  passRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: R.lg, backgroundColor: C.bg },
  passInput: { flex: 1, padding: S.md, fontSize: F.sm, color: C.textPrimary },
  eyeBtn: { paddingHorizontal: S.md },

  roleOption: { flexDirection: 'row', alignItems: 'center', padding: S.md, borderRadius: R.xl, marginBottom: S.sm, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  roleOptionActive: { backgroundColor: 'rgba(245,200,0,0.05)', borderColor: C.primary },
  roleOptionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.sm },
  roleOptionEmoji: { fontSize: F.xl },
  roleOptionLabel: { fontSize: F.sm, fontWeight: '700', color: C.textSecondary },
  roleOptionLabelActive: { color: C.textPrimary },
  roleOptionDesc: { fontSize: F.xs, color: C.textTertiary, marginTop: 1 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioCircleActive: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },

  createBtn: { backgroundColor: C.primary, borderRadius: R.xl, padding: S.md + 2, alignItems: 'center', ...Sh.colored },
  createBtnTxt: { fontWeight: '800', fontSize: F.md, color: C.black },
});

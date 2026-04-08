import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setTeam, updateMember, removeMember, setChecklists, setIncidents } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

const ADMIN_EMAIL = 'armindo@treinar.eng.br';

const ROLE_CFG: any = {
  admin:    { label: 'Admin',    emoji: '⚙️', bg: C.dangerBg,  text: C.dangerDark },
  gestor:   { label: 'Gestor',   emoji: '📊', bg: C.infoBg,    text: C.infoDark },
  inspetor: { label: 'Inspetor', emoji: '🦺', bg: C.successBg, text: C.successDark },
};

export default function AdminScreen() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const team = useSelector((s: RootState) => s.team.list);
  const checklists = useSelector((s: RootState) => s.checklists.list);
  const incidents = useSelector((s: RootState) => s.incidents.list);

  const [refreshing, setRefreshing] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editNome, setEditNome] = useState('');
  const [editRole, setEditRole] = useState('inspetor');
  const [editObra, setEditObra] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'users' | 'stats' | 'logs'>('users');

  // Só admin pode ver esta tela
  if (user?.email !== ADMIN_EMAIL) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.denied}>
          <Text style={s.deniedEmoji}>🔒</Text>
          <Text style={s.deniedTxt}>Acesso restrito</Text>
          <Text style={s.deniedSub}>Esta área é exclusiva do administrador.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const load = async () => {
    setRefreshing(true);
    try {
      const [uRes, cRes, iRes] = await Promise.all([
        api.get('/users'),
        api.get('/checklists'),
        api.get('/incidentes'),
      ]);
      dispatch(setTeam(uRes.data?.users || uRes.data || []));
      dispatch(setChecklists(cRes.data?.checklists || cRes.data || []));
      dispatch(setIncidents(iRes.data?.incidentes || iRes.data || []));
    } catch {}
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (u: any) => {
    setEditUser(u);
    setEditNome(u.name || '');
    setEditRole(u.role || 'inspetor');
    setEditObra(u.obra || '');
    setEditActive(u.active !== false);
    setEditModal(true);
  };

  const salvarEdicao = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const payload = { name: editNome.trim(), role: editRole, obra: editObra.trim(), active: editActive };
      await api.put(`/users/${editUser.id}`, payload);
      dispatch(updateMember({ id: editUser.id, ...payload }));
      setEditModal(false);
      Alert.alert('✅ Atualizado', `${editNome} foi atualizado com sucesso.`);
    } catch {
      // Atualiza localmente mesmo sem servidor
      dispatch(updateMember({ id: editUser.id, name: editNome, role: editRole, obra: editObra, active: editActive }));
      setEditModal(false);
    }
    setSaving(false);
  };

  const confirmarExclusao = (u: any) => {
    if (u.email === ADMIN_EMAIL) { Alert.alert('Ação inválida', 'Você não pode excluir a conta administradora.'); return; }
    Alert.alert('Excluir usuário', `Deseja remover ${u.name} permanentemente?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try { await api.delete(`/users/${u.id}`); } catch {}
          dispatch(removeMember(u.id));
        },
      },
    ]);
  };

  const resetarSenha = (u: any) => {
    Alert.alert('Redefinir senha', `Redefinir a senha de ${u.name} para "treinar123" e exigir nova senha no próximo login?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Redefinir', onPress: async () => {
          try {
            await api.put(`/users/${u.id}`, { force_password_change: true, senha: 'treinar123' });
            Alert.alert('✅ Senha redefinida', `${u.name} deverá criar uma nova senha no próximo acesso.`);
          } catch { Alert.alert('Erro', 'Não foi possível redefinir a senha no servidor.'); }
        },
      },
    ]);
  };

  // Stats
  const ativos = team.filter((u: any) => u.active !== false).length;
  const inspetores = team.filter((u: any) => u.role === 'inspetor').length;
  const totalInsp = checklists.length;
  const conclInsp = checklists.filter((c: any) => c.status === 'concluido').length;
  const incCrit = incidents.filter((i: any) => i.severidade === 'critico').length;
  const conformidade = totalInsp > 0 ? Math.round((conclInsp / totalInsp) * 100) : 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Painel Admin</Text>
          <Text style={s.subtitle}>Acesso exclusivo · {user?.name}</Text>
        </View>
        <View style={s.adminBadge}>
          <Text style={s.adminBadgeTxt}>⚙️ ADMIN</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {([['users','👥 Usuários'],['stats','📊 Métricas'],['logs','📋 Atividade']] as [string,string][]).map(([key, label]) => (
          <TouchableOpacity key={key} style={[s.tab, tab === key && s.tabActive]} onPress={() => setTab(key as any)}>
            <Text style={[s.tabTxt, tab === key && s.tabTxtActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── USUÁRIOS ── */}
        {tab === 'users' && (
          <>
            <View style={s.statsRow}>
              <View style={[s.statCard, { backgroundColor: C.infoBg }]}>
                <Text style={[s.statVal, { color: C.infoDark }]}>{team.length}</Text>
                <Text style={[s.statLabel, { color: C.infoDark }]}>Total</Text>
              </View>
              <View style={[s.statCard, { backgroundColor: C.successBg }]}>
                <Text style={[s.statVal, { color: C.successDark }]}>{ativos}</Text>
                <Text style={[s.statLabel, { color: C.successDark }]}>Ativos</Text>
              </View>
              <View style={[s.statCard, { backgroundColor: C.warningBg }]}>
                <Text style={[s.statVal, { color: C.warningDark }]}>{inspetores}</Text>
                <Text style={[s.statLabel, { color: C.warningDark }]}>Inspetores</Text>
              </View>
            </View>

            {team.map((u: any) => {
              const cfg = ROLE_CFG[u.role] || ROLE_CFG.inspetor;
              const isMe = u.email === ADMIN_EMAIL;
              const inactive = u.active === false;
              return (
                <View key={u.id} style={[s.userCard, inactive && s.userCardInactive]}>
                  <View style={[s.avatar, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.avatarTxt, { color: cfg.text }]}>{u.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={s.userInfo}>
                    <View style={s.userNameRow}>
                      <Text style={s.userName}>{u.name}</Text>
                      {isMe && <View style={s.meBadge}><Text style={s.meTxt}>Você</Text></View>}
                      {inactive && <View style={s.inactiveBadge}><Text style={s.inactiveTxt}>Inativo</Text></View>}
                      {u.force_password_change && <View style={s.pendingBadge}><Text style={s.pendingTxt}>⚠️ Troca senha</Text></View>}
                    </View>
                    <Text style={s.userEmail}>{u.email}</Text>
                    <View style={s.userMeta}>
                      <View style={[s.roleBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[s.roleTxt, { color: cfg.text }]}>{cfg.emoji} {cfg.label}</Text>
                      </View>
                      {u.obra ? <Text style={s.obraTxt}>📍 {u.obra}</Text> : null}
                    </View>
                  </View>
                  {!isMe && (
                    <View style={s.userActions}>
                      <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(u)}>
                        <Text style={s.actionBtnTxt}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.actionBtn} onPress={() => resetarSenha(u)}>
                        <Text style={s.actionBtnTxt}>🔑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} onPress={() => confirmarExclusao(u)}>
                        <Text style={s.actionBtnTxt}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* ── MÉTRICAS ── */}
        {tab === 'stats' && (
          <>
            <View style={s.metricsCard}>
              <Text style={s.metricsTitle}>Visão Geral do Sistema</Text>
              <View style={s.metricsGrid}>
                {[
                  { label: 'Inspeções totais', val: totalInsp, color: C.info },
                  { label: 'Concluídas', val: conclInsp, color: C.success },
                  { label: 'Conformidade', val: `${conformidade}%`, color: C.primary },
                  { label: 'Inc. críticos', val: incCrit, color: C.danger },
                  { label: 'Usuários', val: team.length, color: C.info },
                  { label: 'Offline pendente', val: checklists.filter((c:any)=>c._pendingSync).length, color: C.warning },
                ].map((m) => (
                  <View key={m.label} style={s.metricItem}>
                    <Text style={[s.metricVal, { color: m.color }]}>{m.val}</Text>
                    <Text style={s.metricLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.metricsCard}>
              <Text style={s.metricsTitle}>Inspeções por Status</Text>
              {(['em_andamento','concluido','pendente'] as string[]).map(status => {
                const count = checklists.filter((c:any) => c.status === status).length;
                const pct = totalInsp > 0 ? (count/totalInsp)*100 : 0;
                const colors: any = { concluido: C.success, em_andamento: C.warning, pendente: C.info };
                const labels: any = { concluido: 'Concluído', em_andamento: 'Em Andamento', pendente: 'Pendente' };
                return (
                  <View key={status} style={s.barRow}>
                    <Text style={s.barLabel}>{labels[status]}</Text>
                    <View style={s.barBg}>
                      <View style={[s.barFill, { width: `${pct}%`, backgroundColor: colors[status] }]} />
                    </View>
                    <Text style={s.barVal}>{count}</Text>
                  </View>
                );
              })}
            </View>

            <View style={s.metricsCard}>
              <Text style={s.metricsTitle}>Distribuição por NR</Text>
              {Object.entries(
                checklists.reduce((acc: any, c: any) => { acc[c.norma] = (acc[c.norma] || 0) + 1; return acc; }, {})
              ).sort((a:any,b:any)=>b[1]-a[1]).slice(0,8).map(([norma, count]: any) => (
                <View key={norma} style={s.nrRow}>
                  <View style={s.nrBadge}><Text style={s.nrBadgeTxt}>{norma}</Text></View>
                  <View style={s.barBg}>
                    <View style={[s.barFill, { width: `${(count/Math.max(totalInsp,1))*100}%`, backgroundColor: C.primary }]} />
                  </View>
                  <Text style={s.barVal}>{count}</Text>
                </View>
              ))}
              {checklists.length === 0 && <Text style={s.emptyTxt}>Nenhuma inspeção registrada.</Text>}
            </View>
          </>
        )}

        {/* ── ATIVIDADE ── */}
        {tab === 'logs' && (
          <View style={s.metricsCard}>
            <Text style={s.metricsTitle}>Atividade Recente</Text>
            {[...checklists].sort((a:any,b:any)=>
              new Date(b.data_criacao||0).getTime() - new Date(a.data_criacao||0).getTime()
            ).slice(0,20).map((c:any) => (
              <View key={c.id} style={s.logItem}>
                <View style={[s.logDot, { backgroundColor: c.status === 'concluido' ? C.success : C.warning }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.logTitle} numberOfLines={1}>{c.titulo}</Text>
                  <Text style={s.logMeta}>{c.norma} · {c.responsavel} · {c.obra}</Text>
                </View>
                <Text style={s.logDate}>
                  {c.data_criacao ? new Date(c.data_criacao).toLocaleDateString('pt-BR') : '—'}
                </Text>
              </View>
            ))}
            {checklists.length === 0 && <Text style={s.emptyTxt}>Nenhuma atividade registrada.</Text>}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Modal de edição ── */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModal(false)}>
        <SafeAreaView style={s.modalSafe}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Text style={s.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Editar Usuário</Text>
            <TouchableOpacity onPress={salvarEdicao} disabled={saving}>
              {saving ? <ActivityIndicator color={C.primary} size="small" /> : <Text style={s.modalSave}>Salvar</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={s.fieldLabel}>NOME</Text>
            <TextInput style={s.fieldInput} value={editNome} onChangeText={setEditNome} placeholder="Nome completo" placeholderTextColor={C.textTertiary} />

            <Text style={s.fieldLabel}>PERFIL</Text>
            <View style={s.roleRow}>
              {(['inspetor','gestor','admin'] as string[]).map(r => (
                <TouchableOpacity key={r} style={[s.roleOption, editRole===r&&s.roleOptionActive]} onPress={()=>setEditRole(r)}>
                  <Text style={[s.roleOptionTxt, editRole===r&&s.roleOptionActiveTxt]}>{ROLE_CFG[r].emoji} {ROLE_CFG[r].label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>OBRA / LOCAL</Text>
            <TextInput style={s.fieldInput} value={editObra} onChangeText={setEditObra} placeholder="Obra ou local de trabalho" placeholderTextColor={C.textTertiary} />

            <Text style={s.fieldLabel}>STATUS DA CONTA</Text>
            <View style={s.roleRow}>
              <TouchableOpacity style={[s.roleOption, editActive&&s.roleOptionActive]} onPress={()=>setEditActive(true)}>
                <Text style={[s.roleOptionTxt, editActive&&s.roleOptionActiveTxt]}>✅ Ativa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.roleOption, !editActive&&{borderColor:C.danger,backgroundColor:C.dangerBg}]} onPress={()=>setEditActive(false)}>
                <Text style={[s.roleOptionTxt, !editActive&&{color:C.dangerDark}]}>🚫 Inativa</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl },
  deniedEmoji: { fontSize: 48, marginBottom: S.md },
  deniedTxt: { fontSize: F.xl, fontWeight: '800', color: C.textPrimary },
  deniedSub: { fontSize: F.sm, color: C.textTertiary, marginTop: S.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: S.md },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: F.sm, color: C.textTertiary, marginTop: 2 },
  adminBadge: { backgroundColor: C.dangerBg, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: S.xs, borderWidth: 1, borderColor: C.dangerBorder },
  adminBadgeTxt: { fontSize: F.xs, fontWeight: '800', color: C.dangerDark },
  tabRow: { flexDirection: 'row', paddingHorizontal: S.md, gap: S.sm, marginBottom: S.sm },
  tab: { flex: 1, paddingVertical: S.sm, borderRadius: R.lg, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  tabActive: { backgroundColor: C.black, borderColor: C.black },
  tabTxt: { fontSize: F.xs, fontWeight: '700', color: C.textSecondary },
  tabTxtActive: { color: C.primary },
  scroll: { padding: S.md },
  statsRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.md },
  statCard: { flex: 1, borderRadius: R.xl, padding: S.sm, alignItems: 'center' },
  statVal: { fontSize: F.xl, fontWeight: '900' },
  statLabel: { fontSize: F.xs, fontWeight: '700' },
  userCard: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.sm, flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, ...Sh.xs },
  userCardInactive: { opacity: 0.5 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt: { fontSize: F.lg, fontWeight: '900' },
  userInfo: { flex: 1, gap: 3 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, flexWrap: 'wrap' },
  userName: { fontSize: F.md, fontWeight: '700', color: C.textPrimary },
  meBadge: { backgroundColor: C.primaryLight, borderRadius: R.full, paddingHorizontal: S.xs, paddingVertical: 1 },
  meTxt: { fontSize: F.xs - 1, fontWeight: '800', color: C.primaryDark },
  inactiveBadge: { backgroundColor: C.gray200, borderRadius: R.full, paddingHorizontal: S.xs, paddingVertical: 1 },
  inactiveTxt: { fontSize: F.xs - 1, fontWeight: '600', color: C.gray500 },
  pendingBadge: { backgroundColor: C.warningBg, borderRadius: R.full, paddingHorizontal: S.xs, paddingVertical: 1 },
  pendingTxt: { fontSize: F.xs - 1, fontWeight: '600', color: C.warningDark },
  userEmail: { fontSize: F.xs, color: C.textTertiary },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: S.sm, flexWrap: 'wrap' },
  roleBadge: { borderRadius: R.full, paddingHorizontal: S.xs + 2, paddingVertical: 2 },
  roleTxt: { fontSize: F.xs, fontWeight: '700' },
  obraTxt: { fontSize: F.xs, color: C.textTertiary },
  userActions: { flexDirection: 'column', gap: S.xs },
  actionBtn: { width: 34, height: 34, borderRadius: R.md, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  actionBtnDanger: { borderColor: C.dangerBorder, backgroundColor: C.dangerBg },
  actionBtnTxt: { fontSize: F.sm },
  metricsCard: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  metricsTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  metricItem: { width: '30%', alignItems: 'center', padding: S.sm, backgroundColor: C.bg, borderRadius: R.lg },
  metricVal: { fontSize: F.xl, fontWeight: '900' },
  metricLabel: { fontSize: F.xs, color: C.textTertiary, textAlign: 'center', marginTop: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  barLabel: { width: 90, fontSize: F.xs, color: C.textSecondary, fontWeight: '600' },
  barBg: { flex: 1, height: 6, backgroundColor: C.gray200, borderRadius: R.full, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: R.full },
  barVal: { width: 24, textAlign: 'right', fontSize: F.xs, fontWeight: '700', color: C.textSecondary },
  nrRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  nrBadge: { backgroundColor: C.black, borderRadius: R.full, paddingHorizontal: S.xs + 2, paddingVertical: 2 },
  nrBadgeTxt: { color: C.primary, fontSize: F.xs, fontWeight: '800' },
  emptyTxt: { color: C.textTertiary, textAlign: 'center', paddingVertical: S.md },
  logItem: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.divider },
  logDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  logTitle: { fontSize: F.sm, fontWeight: '600', color: C.textPrimary },
  logMeta: { fontSize: F.xs, color: C.textTertiary },
  logDate: { fontSize: F.xs, color: C.textTertiary, flexShrink: 0 },
  modalSafe: { flex: 1, backgroundColor: C.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: S.md, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  modalCancel: { fontSize: F.md, color: C.textTertiary },
  modalTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary },
  modalSave: { fontSize: F.md, color: C.primary, fontWeight: '800' },
  modalScroll: { padding: S.lg, paddingBottom: 100 },
  fieldLabel: { fontSize: F.xs, fontWeight: '700', color: C.textTertiary, letterSpacing: 1.5, marginBottom: S.xs, marginTop: S.md },
  fieldInput: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.card },
  roleRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  roleOption: { flex: 1, padding: S.sm, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', backgroundColor: C.bg },
  roleOptionActive: { backgroundColor: 'rgba(245,200,0,0.08)', borderColor: C.primary },
  roleOptionTxt: { fontSize: F.sm, fontWeight: '700', color: C.textSecondary },
  roleOptionActiveTxt: { color: C.textPrimary },
});

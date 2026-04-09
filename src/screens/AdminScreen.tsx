import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, Pressable,
  Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline, G } from 'react-native-svg';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState, setTeam, updateMember, removeMember, setChecklists, setIncidents } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';
import {
  IcUser, IcPlus, IcEdit, IcKey, IcTrash, IcActivity,
  IcShield, IcChecklists, IcIncidents, IcCheck, IcX,
  IcRefresh, IcMail, IcBuilding, IcClock, IcMore, IcPDF,
} from '../components/Icons';
import Logo from '../components/Logo';

const ADMIN_EMAIL = 'armindo@treinar.eng.br';
const { width: SW } = Dimensions.get('window');

const ROLE_CFG: any = {
  admin:    { label: 'Admin',    color: C.dangerDark,  bg: C.dangerBg,  dot: C.danger },
  gestor:   { label: 'Gestor',   color: C.infoDark,    bg: C.infoBg,    dot: C.info },
  inspetor: { label: 'Inspetor', color: C.successDark, bg: C.successBg, dot: C.success },
};

// ─── Metric card ─────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, color, bg, icon: Icon }: any) => (
  <View style={[mc.card, { backgroundColor: bg }]}>
    <View style={mc.iconRow}>
      <Icon color={color} size={16} />
    </View>
    <Text style={[mc.val, { color }]}>{value}</Text>
    <Text style={[mc.label, { color }]}>{label}</Text>
  </View>
);
const mc = StyleSheet.create({
  card: { flex: 1, borderRadius: R.xl, padding: S.sm + 2, gap: S.xs },
  iconRow: { opacity: 0.7 },
  val: { fontSize: F.xxl, fontWeight: '900', lineHeight: F.xxl + 2 },
  label: { fontSize: F.xs, fontWeight: '600', opacity: 0.75 },
});

// ─── Quick Action button ─────────────────────────────────────────────────────
const QuickAction = ({ label, icon: Icon, color, bg, onPress }: any) => (
  <TouchableOpacity style={[qa.btn, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.75}>
    <View style={[qa.iconBox, { backgroundColor: `${color}20` }]}>
      <Icon color={color} size={20} />
    </View>
    <Text style={[qa.label, { color }]}>{label}</Text>
  </TouchableOpacity>
);
const qa = StyleSheet.create({
  btn: { flex: 1, borderRadius: R.xl, padding: S.sm + 2, alignItems: 'center', gap: S.xs, minWidth: (SW - S.md * 2 - S.sm * 3) / 4 },
  iconBox: { width: 40, height: 40, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: F.xs, fontWeight: '700', textAlign: 'center' },
});

// ─── User row ────────────────────────────────────────────────────────────────
const UserRow = ({ user, isMe, onEdit, onResetPassword, onToggleActive, onDelete }: any) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = ROLE_CFG[user.role] || ROLE_CFG.inspetor;
  const inactive = user.active === false;

  return (
    <>
      <View style={[ur.row, inactive && { opacity: 0.5 }]}>
        <View style={[ur.avatar, { backgroundColor: cfg.bg }]}>
          <Text style={[ur.avatarTxt, { color: cfg.color }]}>
            {user.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={ur.info}>
          <View style={ur.nameRow}>
            <Text style={ur.name} numberOfLines={1}>{user.name}</Text>
            {isMe && <View style={ur.youBadge}><Text style={ur.youTxt}>você</Text></View>}
            {user.force_password_change && (
              <View style={ur.warnBadge}><Text style={ur.warnTxt}>troca senha</Text></View>
            )}
          </View>
          <Text style={ur.email} numberOfLines={1}>{user.email}</Text>
          <View style={ur.metaRow}>
            <View style={[ur.rolePill, { backgroundColor: cfg.bg }]}>
              <View style={[ur.roleDot, { backgroundColor: cfg.dot }]} />
              <Text style={[ur.roleTxt, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            {user.obra ? <Text style={ur.obra}>{user.obra}</Text> : null}
          </View>
        </View>
        {!isMe && (
          <Pressable style={ur.moreBtn} onPress={() => setMenuOpen(true)} hitSlop={8}>
            <IcMore color={C.textTertiary} size={18} />
          </Pressable>
        )}
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={ur.overlay} onPress={() => setMenuOpen(false)}>
          <View style={ur.menu}>
            <View style={ur.menuHandle} />
            <Text style={ur.menuName}>{user.name}</Text>
            <Text style={ur.menuEmail}>{user.email}</Text>
            <View style={ur.menuDivider} />
            <Pressable style={ur.menuItem} onPress={() => { setMenuOpen(false); onEdit(); }}>
              <IcEdit color={C.textSecondary} size={18} />
              <Text style={ur.menuItemTxt}>Editar informações</Text>
            </Pressable>
            <Pressable style={ur.menuItem} onPress={() => { setMenuOpen(false); onResetPassword(); }}>
              <IcKey color={C.textSecondary} size={18} />
              <Text style={ur.menuItemTxt}>Redefinir senha</Text>
            </Pressable>
            <Pressable style={ur.menuItem} onPress={() => { setMenuOpen(false); onToggleActive(); }}>
              {inactive
                ? <IcCheck color={C.success} size={18} />
                : <IcX color={C.warning} size={18} />
              }
              <Text style={ur.menuItemTxt}>{inactive ? 'Reativar conta' : 'Desativar conta'}</Text>
            </Pressable>
            <View style={ur.menuDivider} />
            <Pressable style={ur.menuItem} onPress={() => { setMenuOpen(false); onDelete(); }}>
              <IcTrash color={C.danger} size={18} />
              <Text style={[ur.menuItemTxt, { color: C.danger }]}>Excluir usuário</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};
const ur = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.divider },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt: { fontSize: F.lg, fontWeight: '800' },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, flexWrap: 'wrap' },
  name: { fontSize: F.sm, fontWeight: '700', color: C.textPrimary },
  youBadge: { backgroundColor: C.primaryLight, borderRadius: R.full, paddingHorizontal: 5, paddingVertical: 1 },
  youTxt: { fontSize: F.xs - 1, fontWeight: '800', color: C.primaryDark },
  warnBadge: { backgroundColor: C.warningBg, borderRadius: R.full, paddingHorizontal: 5, paddingVertical: 1 },
  warnTxt: { fontSize: F.xs - 1, fontWeight: '600', color: C.warningDark },
  email: { fontSize: F.xs, color: C.textTertiary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: R.full, paddingHorizontal: S.xs + 2, paddingVertical: 2 },
  roleDot: { width: 5, height: 5, borderRadius: 2.5 },
  roleTxt: { fontSize: F.xs - 1, fontWeight: '700' },
  obra: { fontSize: F.xs, color: C.textTertiary },
  moreBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  menu: { backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, padding: S.lg, paddingBottom: S.xxxl },
  menuHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.gray300, alignSelf: 'center', marginBottom: S.md },
  menuName: { fontSize: F.md, fontWeight: '700', color: C.textPrimary },
  menuEmail: { fontSize: F.xs, color: C.textTertiary, marginBottom: S.sm },
  menuDivider: { height: 1, backgroundColor: C.border, marginVertical: S.xs },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md, borderRadius: R.lg },
  menuItemTxt: { fontSize: F.md, color: C.textPrimary, fontWeight: '500' },
});

// ─── Activity item ────────────────────────────────────────────────────────────
const ActivityItem = ({ item }: { item: any }) => {
  const date = item.data_criacao ? new Date(item.data_criacao) : new Date();
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <View style={ai.row}>
      <View style={[ai.dot, { backgroundColor: item.status === 'concluido' ? C.success : C.warning }]} />
      <View style={ai.content}>
        <Text style={ai.title} numberOfLines={1}>{item.titulo}</Text>
        <Text style={ai.meta}>{item.norma} · {item.responsavel} · {item.obra}</Text>
      </View>
      <View style={ai.timeBox}>
        <Text style={ai.time}>{isToday ? timeStr : dateStr}</Text>
        <View style={[ai.statusDot, { backgroundColor: item.status === 'concluido' ? C.success : C.warning }]} />
      </View>
    </View>
  );
};
const ai = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.divider },
  dot: { width: 3, height: 36, borderRadius: R.full, flexShrink: 0 },
  content: { flex: 1 },
  title: { fontSize: F.sm, fontWeight: '600', color: C.textPrimary },
  meta: { fontSize: F.xs, color: C.textTertiary, marginTop: 1 },
  timeBox: { alignItems: 'flex-end', gap: 3 },
  time: { fontSize: F.xs, color: C.textTertiary },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
});

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ visible, user, onSave, onClose }: any) {
  const [nome, setNome] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'inspetor');
  const [obra, setObra] = useState(user?.obra || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) { setNome(user.name || ''); setRole(user.role || 'inspetor'); setObra(user.obra || ''); }
  }, [user]);

  const save = async () => {
    setSaving(true);
    await onSave(user.id, { name: nome.trim(), role, obra: obra.trim() });
    setSaving(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={em.safe}>
        <View style={em.header}>
          <TouchableOpacity onPress={onClose}><Text style={em.cancel}>Cancelar</Text></TouchableOpacity>
          <Text style={em.title}>Editar Usuário</Text>
          <TouchableOpacity onPress={save} disabled={saving}><Text style={em.save}>Salvar</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={em.scroll} keyboardShouldPersistTaps="handled">
          <View style={em.card}>
            <Text style={em.label}>NOME</Text>
            <TextInput style={em.input} value={nome} onChangeText={setNome} placeholder="Nome completo" placeholderTextColor={C.textTertiary} />
            <Text style={em.label}>OBRA / LOCAL</Text>
            <TextInput style={em.input} value={obra} onChangeText={setObra} placeholder="Obra ou local (opcional)" placeholderTextColor={C.textTertiary} />
          </View>
          <View style={em.card}>
            <Text style={em.sectionTitle}>Perfil de acesso</Text>
            {(['inspetor', 'gestor', 'admin'] as string[]).map(r => {
              const cfg = ROLE_CFG[r];
              return (
                <Pressable key={r} style={[em.roleOption, role === r && em.roleOptionActive]} onPress={() => setRole(r)}>
                  <View style={[em.roleOptionDot, { backgroundColor: cfg.dot }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[em.roleOptionLabel, role === r && { color: C.textPrimary }]}>{cfg.label}</Text>
                  </View>
                  {role === r && <IcCheck color={C.primary} size={18} />}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const em = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: S.md, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  cancel: { fontSize: F.md, color: C.textTertiary },
  title: { fontSize: F.md, fontWeight: '800', color: C.textPrimary },
  save: { fontSize: F.md, color: C.primary, fontWeight: '800' },
  scroll: { padding: S.md, paddingBottom: 100 },
  card: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  sectionTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },
  label: { fontSize: F.xs, fontWeight: '700', color: C.textTertiary, letterSpacing: 1.2, marginBottom: S.xs, marginTop: S.sm },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.bg },
  roleOption: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md, borderRadius: R.xl, marginBottom: S.xs, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  roleOptionActive: { borderColor: C.primary, backgroundColor: 'rgba(245,200,0,0.04)' },
  roleOptionDot: { width: 10, height: 10, borderRadius: 5 },
  roleOptionLabel: { fontSize: F.sm, fontWeight: '600', color: C.textSecondary },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function AdminScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const team = useSelector((s: RootState) => s.team.list);
  const checklists = useSelector((s: RootState) => s.checklists.list);
  const incidents = useSelector((s: RootState) => s.incidents.list);
  const isOnline = useSelector((s: RootState) => s.app.isOnline);

  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'overview' | 'users' | 'activity'>('overview');
  const [editUser, setEditUser] = useState<any>(null);
  const [searchUser, setSearchUser] = useState('');

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.denied}>
          <IcShield color={C.gray300} size={56} />
          <Text style={s.deniedTxt}>Acesso restrito</Text>
          <Text style={s.deniedSub}>Área exclusiva do administrador.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [uR, cR, iR] = await Promise.all([
        api.get('/users'),
        api.get('/checklists'),
        api.get('/incidentes'),
      ]);
      dispatch(setTeam(uR.data?.users || uR.data || []));
      dispatch(setChecklists(cR.data?.checklists || cR.data || []));
      dispatch(setIncidents(iR.data?.incidentes || iR.data || []));
    } catch {}
    finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Metrics
  const totalInsp = checklists.length;
  const concluidas = checklists.filter((c: any) => c.status === 'concluido').length;
  const emAndamento = checklists.filter((c: any) => c.status === 'em_andamento').length;
  const conformidade = totalInsp > 0 ? Math.round((concluidas / totalInsp) * 100) : 0;
  const incCriticos = incidents.filter((i: any) => i.severidade === 'critico' && i.status === 'aberto').length;
  const pendingSync = checklists.filter((c: any) => c._pendingSync).length;
  const usuariosAtivos = team.filter((u: any) => u.active !== false).length;

  const handleSaveUser = async (id: any, data: any) => {
    try {
      await api.put(`/users/${id}`, data);
      dispatch(updateMember({ id, ...data }));
    } catch {
      dispatch(updateMember({ id, ...data }));
    }
  };

  const handleResetPassword = (u: any) => {
    Alert.alert('Redefinir senha', `Redefinir a senha de ${u.name} para "treinar123"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Redefinir', onPress: async () => {
        try {
          await api.put(`/users/${u.id}`, { force_password_change: true, senha: 'treinar123' });
          Alert.alert('Senha redefinida', `${u.name} precisará criar nova senha no próximo acesso.`);
        } catch { Alert.alert('Erro', 'Não foi possível redefinir a senha.'); }
      }},
    ]);
  };

  const handleToggleActive = (u: any) => {
    const newActive = u.active === false ? true : false;
    Alert.alert(
      newActive ? 'Reativar conta' : 'Desativar conta',
      `${newActive ? 'Reativar' : 'Desativar'} a conta de ${u.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: async () => {
          try { await api.put(`/users/${u.id}`, { active: newActive }); } catch {}
          dispatch(updateMember({ id: u.id, active: newActive }));
        }},
      ]
    );
  };

  const handleDelete = (u: any) => {
    if (u.email === ADMIN_EMAIL) { Alert.alert('Ação inválida', 'Não é possível excluir a conta administradora.'); return; }
    Alert.alert('Excluir usuário', `Excluir ${u.name} permanentemente?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try { await api.delete(`/users/${u.id}`); } catch {}
        dispatch(removeMember(u.id));
      }},
    ]);
  };

  const filteredTeam = team.filter((u: any) =>
    !searchUser || u.name?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const recentActivity = [...checklists]
    .sort((a: any, b: any) => new Date(b.data_criacao || 0).getTime() - new Date(a.data_criacao || 0).getTime())
    .slice(0, 25);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Hero Header ── */}
      <View style={s.hero}>
        <View style={s.heroTop}>
          <View>
            <Text style={s.heroLabel}>CENTRO DE COMANDO</Text>
            <Text style={s.heroTitle}>Treinar Engenharia</Text>
            <View style={[s.statusPill, { backgroundColor: isOnline ? 'rgba(48,209,88,0.15)' : 'rgba(255,159,10,0.15)' }]}>
              <View style={[s.statusDot, { backgroundColor: isOnline ? C.success : C.warning }]} />
              <Text style={[s.statusTxt, { color: isOnline ? C.success : C.warning }]}>
                {isOnline ? 'Sistema online' : 'Modo offline'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={load} style={s.refreshBtn}>
            <IcRefresh color={C.gray500} size={18} />
          </TouchableOpacity>
        </View>

        {/* Metric strip */}
        <View style={s.metricStrip}>
          <View style={s.metric}>
            <Text style={s.metricVal}>{usuariosAtivos}</Text>
            <Text style={s.metricLabel}>usuários</Text>
          </View>
          <View style={s.metricDiv} />
          <View style={s.metric}>
            <Text style={s.metricVal}>{totalInsp}</Text>
            <Text style={s.metricLabel}>inspeções</Text>
          </View>
          <View style={s.metricDiv} />
          <View style={s.metric}>
            <Text style={[s.metricVal, { color: conformidade >= 80 ? C.success : conformidade >= 60 ? C.warning : C.danger }]}>
              {conformidade}%
            </Text>
            <Text style={s.metricLabel}>conformidade</Text>
          </View>
          <View style={s.metricDiv} />
          <View style={s.metric}>
            <Text style={[s.metricVal, incCriticos > 0 && { color: C.danger }]}>{incCriticos}</Text>
            <Text style={s.metricLabel}>críticos</Text>
          </View>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabBar}>
        {([
          ['overview', 'Visão Geral', IcChecklists],
          ['users', `Usuários (${team.length})`, IcUser],
          ['activity', 'Atividade', IcActivity],
        ] as [string, string, any][]).map(([key, label, Icon]) => (
          <Pressable key={key} style={[s.tab, tab === key && s.tabActive]} onPress={() => setTab(key as any)}>
            <Icon color={tab === key ? C.primary : C.textTertiary} size={14} />
            <Text style={[s.tabTxt, tab === key && s.tabTxtActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            {/* KPI grid */}
            <View style={s.kpiGrid}>
              <MetricCard label="Concluídas" value={concluidas} color={C.successDark} bg={C.successBg} icon={IcChecklists} />
              <MetricCard label="Em andamento" value={emAndamento} color={C.warningDark} bg={C.warningBg} icon={IcChecklists} />
              <MetricCard label="Inc. abertos" value={incidents.filter((i: any) => i.status === 'aberto').length} color={C.dangerDark} bg={C.dangerBg} icon={IcIncidents} />
              <MetricCard label="Sync pendente" value={pendingSync} color={pendingSync > 0 ? C.warningDark : C.successDark} bg={pendingSync > 0 ? C.warningBg : C.successBg} icon={IcRefresh} />
            </View>

            {/* Quick actions */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Ações rápidas</Text>
              <View style={s.quickGrid}>
                <QuickAction label="Novo usuário" icon={IcPlus} color={C.infoDark} bg={C.infoBg}
                  onPress={() => navigation?.navigate?.('Equipe') || Alert.alert('', 'Vá para a aba Equipe para criar usuários.')} />
                <QuickAction label="Relatório geral" icon={IcPDF} color={C.successDark} bg={C.successBg}
                  onPress={() => Alert.alert('Relatório Geral', `${totalInsp} inspeções · ${conformidade}% conformidade\n${concluidas} concluídas · ${incCriticos} críticos abertos`)} />
                <QuickAction label="Resetar senhas" icon={IcKey} color={C.warningDark} bg={C.warningBg}
                  onPress={() => { setTab('users'); }} />
                <QuickAction label="Sincronizar" icon={IcRefresh} color={C.dangerDark} bg={C.dangerBg}
                  onPress={load} />
              </View>
            </View>

            {/* Inspeções por NR */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Inspeções por NR</Text>
              {(() => {
                const byNR = checklists.reduce((acc: any, c: any) => {
                  acc[c.norma] = (acc[c.norma] || 0) + 1;
                  return acc;
                }, {});
                const sorted = Object.entries(byNR).sort((a: any, b: any) => b[1] - a[1]).slice(0, 8);
                const max = sorted[0]?.[1] as number || 1;
                return sorted.map(([norma, count]: any) => (
                  <View key={norma} style={s.nrBarRow}>
                    <View style={s.nrBadge}><Text style={s.nrBadgeTxt}>{norma}</Text></View>
                    <View style={s.nrBarBg}>
                      <View style={[s.nrBarFill, { width: `${(count / max) * 100}%` }]} />
                    </View>
                    <Text style={s.nrBarVal}>{count}</Text>
                  </View>
                ));
              })()}
              {checklists.length === 0 && <Text style={s.emptyTxt}>Nenhuma inspeção registrada.</Text>}
            </View>

            {/* Team distribution */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Distribuição da equipe</Text>
              <View style={s.teamDist}>
                {(['inspetor', 'gestor', 'admin'] as string[]).map(role => {
                  const count = team.filter((u: any) => u.role === role).length;
                  const cfg = ROLE_CFG[role];
                  return (
                    <View key={role} style={[s.distCard, { backgroundColor: cfg.bg }]}>
                      <Text style={[s.distVal, { color: cfg.color }]}>{count}</Text>
                      <Text style={[s.distLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <>
            <View style={s.searchWrap}>
              <TextInput
                style={s.searchInput}
                value={searchUser}
                onChangeText={setSearchUser}
                placeholder="Buscar por nome ou e-mail..."
                placeholderTextColor={C.textTertiary}
              />
            </View>

            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Colaboradores</Text>
                <Text style={s.sectionCount}>{filteredTeam.length} de {team.length}</Text>
              </View>
              {filteredTeam.length === 0 && (
                <Text style={s.emptyTxt}>Nenhum usuário encontrado.</Text>
              )}
              {filteredTeam.map((u: any) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isMe={u.email === ADMIN_EMAIL}
                  onEdit={() => setEditUser(u)}
                  onResetPassword={() => handleResetPassword(u)}
                  onToggleActive={() => handleToggleActive(u)}
                  onDelete={() => handleDelete(u)}
                />
              ))}
            </View>

            <View style={s.infoBox}>
              <IcShield color={C.infoDark} size={16} />
              <Text style={s.infoTxt}>
                Para criar novos colaboradores, use a aba Equipe. Aqui você gerencia permissões e status das contas existentes.
              </Text>
            </View>
          </>
        )}

        {/* ── ACTIVITY ── */}
        {tab === 'activity' && (
          <>
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Feed de atividades</Text>
                <Text style={s.sectionCount}>últimas {recentActivity.length}</Text>
              </View>
              {recentActivity.length === 0 && (
                <Text style={s.emptyTxt}>Nenhuma atividade registrada.</Text>
              )}
              {recentActivity.map((item: any) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Incidentes recentes</Text>
              {incidents.slice(0, 10).map((item: any) => (
                <View key={item.id} style={ai.row}>
                  <View style={[ai.dot, {
                    backgroundColor: item.severidade === 'critico' ? C.danger : item.severidade === 'alto' ? C.warning : C.info
                  }]} />
                  <View style={ai.content}>
                    <Text style={ai.title} numberOfLines={1}>{item.titulo}</Text>
                    <Text style={ai.meta}>{item.tipo} · {item.responsavel} · {item.local || item.obra}</Text>
                  </View>
                  <View style={[ai.timeBox]}>
                    <Text style={[ai.time, { color: item.severidade === 'critico' ? C.danger : C.textTertiary }]}>
                      {item.severidade}
                    </Text>
                  </View>
                </View>
              ))}
              {incidents.length === 0 && <Text style={s.emptyTxt}>Nenhum incidente registrado.</Text>}
            </View>
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <EditUserModal
        visible={!!editUser}
        user={editUser}
        onSave={handleSaveUser}
        onClose={() => setEditUser(null)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.md },
  deniedTxt: { fontSize: F.xl, fontWeight: '800', color: C.textPrimary },
  deniedSub: { fontSize: F.sm, color: C.textTertiary },

  // Hero
  hero: { backgroundColor: C.black, paddingHorizontal: S.md, paddingTop: S.md, paddingBottom: S.sm },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: S.md },
  heroLabel: { fontSize: F.xs, color: C.gray600, fontWeight: '700', letterSpacing: 1.5 },
  heroTitle: { fontSize: F.xl, fontWeight: '900', color: C.white, marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3, marginTop: S.xs, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: F.xs, fontWeight: '700' },
  refreshBtn: { width: 36, height: 36, borderRadius: R.lg, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  metricStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.xl, padding: S.sm },
  metric: { flex: 1, alignItems: 'center' },
  metricVal: { fontSize: F.lg, fontWeight: '900', color: C.white },
  metricLabel: { fontSize: F.xs - 1, color: C.gray600, fontWeight: '600', marginTop: 1 },
  metricDiv: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Tabs
  tabBar: { flexDirection: 'row', paddingHorizontal: S.md, paddingTop: S.sm, gap: S.xs, backgroundColor: C.black, paddingBottom: S.sm },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: S.xs + 2, borderRadius: R.lg, backgroundColor: 'rgba(255,255,255,0.06)' },
  tabActive: { backgroundColor: 'rgba(245,200,0,0.12)', borderWidth: 1, borderColor: 'rgba(245,200,0,0.25)' },
  tabTxt: { fontSize: F.xs, color: C.gray500, fontWeight: '600' },
  tabTxtActive: { color: C.primary },

  scroll: { padding: S.md },

  // Sections
  section: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md },
  sectionTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },
  sectionCount: { fontSize: F.xs, color: C.textTertiary, fontWeight: '600' },
  emptyTxt: { color: C.textTertiary, textAlign: 'center', paddingVertical: S.md },

  // KPI
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.md },

  // Quick actions
  quickGrid: { flexDirection: 'row', gap: S.sm },

  // NR bars
  nrBarRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  nrBadge: { backgroundColor: C.black, borderRadius: R.full, paddingHorizontal: S.xs + 2, paddingVertical: 2, minWidth: 48 },
  nrBadgeTxt: { color: C.primary, fontSize: F.xs, fontWeight: '800', textAlign: 'center' },
  nrBarBg: { flex: 1, height: 6, backgroundColor: C.gray200, borderRadius: R.full, overflow: 'hidden' },
  nrBarFill: { height: 6, backgroundColor: C.primary, borderRadius: R.full },
  nrBarVal: { width: 24, textAlign: 'right', fontSize: F.xs, fontWeight: '700', color: C.textSecondary },

  // Team dist
  teamDist: { flexDirection: 'row', gap: S.sm },
  distCard: { flex: 1, borderRadius: R.xl, padding: S.sm, alignItems: 'center', gap: 3 },
  distVal: { fontSize: F.xxl, fontWeight: '900' },
  distLabel: { fontSize: F.xs, fontWeight: '700' },

  // Search
  searchWrap: { backgroundColor: C.card, borderRadius: R.xl, paddingHorizontal: S.md, marginBottom: S.sm, borderWidth: 1, borderColor: C.border, ...Sh.xs },
  searchInput: { paddingVertical: S.sm + 2, fontSize: F.sm, color: C.textPrimary },

  // Info box
  infoBox: { flexDirection: 'row', gap: S.sm, backgroundColor: C.infoBg, borderRadius: R.xl, padding: S.md, marginBottom: S.md, alignItems: 'flex-start', borderWidth: 1, borderColor: C.infoBorder },
  infoTxt: { flex: 1, fontSize: F.xs, color: C.infoDark, lineHeight: 18 },
});

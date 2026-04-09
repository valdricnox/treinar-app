import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState, clearAuth } from '../store';
import Logo from '../components/Logo';
import { IcLogout, IcShield, IcActivity, IcUser, IcCheck, IcWarning } from '../components/Icons';
import { C, S, R, F, Sh } from '../theme';

const NRS_ALL = ['NR-5','NR-6','NR-7','NR-9','NR-10','NR-11','NR-12','NR-17','NR-18','NR-20','NR-21','NR-23','NR-26','NR-33','NR-35'];

const ROLE_CONFIG: any = {
  admin:    { label: 'Administrador', bg: C.dangerBg,  text: C.dangerDark },
  gestor:   { label: 'Gestor', bg: C.infoBg,    text: C.infoDark },
  inspetor: { label: 'Inspetor', bg: C.successBg, text: C.successDark },
};

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const checklists = useSelector((s: RootState) => s.checklists.list);
  const incidents = useSelector((s: RootState) => s.incidents.list);
  const isOnline = useSelector((s: RootState) => s.app.isOnline);
  const lastSync = useSelector((s: RootState) => s.app.lastSync);
  const pendingCount = useSelector((s: RootState) => s.checklists.pendingSync.length + s.incidents.pendingSync.length);

  const myChecklists = checklists.filter((c: any) => c.user_id === user?.id || c.responsavel === user?.name);
  const myConcluded = myChecklists.filter((c: any) => c.status === 'concluido');
  const myIncidents = incidents.filter((i: any) => i.user_id === user?.id || i.responsavel === user?.name);

  const roleConf = ROLE_CONFIG[user?.role] || ROLE_CONFIG.inspetor;

  const logout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair? Os dados offline serão mantidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair', style: 'destructive', onPress: async () => {
            await AsyncStorage.removeItem('token');
            dispatch(clearAuth());
          },
        },
      ]
    );
  };

  const formatSync = (iso: string | null) => {
    if (!iso) return 'Nunca';
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Card perfil */}
        <View style={s.profileCard}>
          <View style={[s.avatarBig, { backgroundColor: roleConf.bg }]}>
            <Text style={[s.avatarTxt, { color: roleConf.text }]}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={s.profileName}>{user?.name}</Text>
          <Text style={s.profileEmail}>{user?.email}</Text>
          <View style={[s.rolePill, { backgroundColor: roleConf.bg }]}>
            <Text style={[s.roleTxt, { color: roleConf.text }]}>{roleConf.label}</Text>
          </View>
          {user?.obra ? (
            <View style={s.obraRow}>
              <Text style={s.obraTxt}>{user.obra}</Text>
            </View>
          ) : null}
        </View>

        {/* Status de conexão */}
        <View style={[s.statusCard, { backgroundColor: isOnline ? C.successBg : C.warningBg, borderColor: isOnline ? C.successBorder : C.warningBorder }]}>
          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: isOnline ? C.success : C.warning }]} />
            <Text style={[s.statusTxt, { color: isOnline ? C.successDark : C.warningDark }]}>
              {isOnline ? '● Online — conectado ao servidor' : '● Offline — dados salvos localmente'}
            </Text>
          </View>
          <Text style={[s.syncTxt, { color: isOnline ? C.successDark : C.warningDark }]}>
            Última sync: {formatSync(lastSync)}
          </Text>
          {pendingCount > 0 && (
            <Text style={s.pendingTxt}>{pendingCount} item(s) aguardando sincronização</Text>
          )}
        </View>

        {/* Estatísticas */}
        <View style={s.statsCard}>
          <Text style={s.sectionTitle}>Minhas Estatísticas</Text>
          <View style={s.statsGrid}>
            <View style={s.statItem}>
              <Text style={s.statVal}>{myChecklists.length}</Text>
              <Text style={s.statLabel}>Inspeções</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: C.success }]}>{myConcluded.length}</Text>
              <Text style={s.statLabel}>Concluídas</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: C.info }]}>{myIncidents.length}</Text>
              <Text style={s.statLabel}>Incidentes</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: C.primary }]}>
                {myChecklists.length > 0 ? Math.round((myConcluded.length / myChecklists.length) * 100) : 0}%
              </Text>
              <Text style={s.statLabel}>Conform.</Text>
            </View>
          </View>
        </View>

        {/* NRs habilitadas */}
        <View style={s.nrCard}>
          <Text style={s.sectionTitle}>NRs Habilitadas</Text>
          <Text style={s.sectionSub}>{NRS_ALL.length} normas disponíveis</Text>
          <View style={s.nrGrid}>
            {NRS_ALL.map((nr) => (
              <View key={nr} style={s.nrChip}>
                <IcCheck color={C.successDark} size={11} />
                <Text style={s.nrTxt}>{nr}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Informações da conta */}
        <View style={s.infoCard}>
          <Text style={s.sectionTitle}>Informações da Conta</Text>
          {[
            { label: 'Nome', value: user?.name },
            { label: 'E-mail', value: user?.email },
            { label: 'Perfil', value: roleConf.label },
            { label: 'Obra', value: user?.obra || 'Não informado' },
          ].map((item) => (
            <View key={item.label} style={s.infoRow}>
              <Text style={s.infoLabel}>{item.label}</Text>
              <Text style={s.infoVal} numberOfLines={1}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Logo + versão */}
        <View style={s.brandBox}>
          <Logo size="md" />
          <Text style={s.versionTxt}>v3.1.0 · Praia Grande, SP</Text>
        </View>

        {/* Botão sair */}
        <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <IcLogout color={C.dangerDark} size={18} /><Text style={s.logoutTxt}>Sair da Conta</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.md, paddingBottom: 100 },

  profileCard: { backgroundColor: C.black, borderRadius: R.xxl, padding: S.xl, alignItems: 'center', marginBottom: S.md, ...Sh.md },
  avatarBig: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: S.md },
  avatarTxt: { fontSize: F.display, fontWeight: '900' },
  profileName: { fontSize: F.xl, fontWeight: '800', color: C.white, marginBottom: S.xs },
  profileEmail: { fontSize: F.sm, color: C.gray500, marginBottom: S.md },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: S.xs, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.xs },

  roleTxt: { fontWeight: '800', fontSize: F.sm },
  obraRow: { marginTop: S.sm },
  obraTxt: { fontSize: F.sm, color: C.gray500 },

  statusCard: { borderRadius: R.xl, padding: S.md, marginBottom: S.md, borderWidth: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { fontSize: F.sm, fontWeight: '700' },
  syncTxt: { fontSize: F.xs, fontWeight: '600' },
  pendingTxt: { fontSize: F.xs, color: C.warningDark, fontWeight: '700', marginTop: S.xs },

  statsCard: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  sectionTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.xs },
  sectionSub: { fontSize: F.xs, color: C.textTertiary, marginBottom: S.md },
  statsGrid: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.sm },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: F.xxl, fontWeight: '900', color: C.textPrimary },
  statLabel: { fontSize: F.xs, color: C.textTertiary, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: C.border },

  nrCard: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  nrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  nrChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.successBg, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: S.xs },
  nrCheck: { fontSize: F.xs, color: C.successDark, fontWeight: '900' },
  nrTxt: { fontSize: F.xs, fontWeight: '800', color: C.successDark },

  infoCard: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.divider },
  infoLabel: { fontSize: F.sm, color: C.textTertiary, fontWeight: '600' },
  infoVal: { fontSize: F.sm, fontWeight: '700', color: C.textPrimary, maxWidth: '60%', textAlign: 'right' },

  brandBox: { alignItems: 'center', gap: S.sm, marginBottom: S.lg, paddingVertical: S.md },
  versionTxt: { fontSize: F.xs, color: C.textTertiary, fontWeight: '600' },

  logoutBtn: { backgroundColor: C.dangerBg, borderRadius: R.xl, padding: S.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, borderWidth: 1.5, borderColor: C.dangerBorder },
  logoutTxt: { fontWeight: '800', fontSize: F.md, color: C.dangerDark },
});

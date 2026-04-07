import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState, clearAuth } from '../store';
import Logo from '../components/Logo';
import { C, S, R, F, Sh } from '../theme';

const NRS = ['NR-6', 'NR-10', 'NR-12', 'NR-18', 'NR-23', 'NR-33', 'NR-35'];

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const checklists = useSelector((s: RootState) => s.checklists.list);
  const incidents = useSelector((s: RootState) => s.incidents.list);

  const myChecklists = checklists.filter((c: any) => c.user_id === user?.id || c.responsavel === user?.name);
  const myConcluded = myChecklists.filter((c: any) => c.status === 'concluido');

  const logout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('token');
          dispatch(clearAuth());
        },
      },
    ]);
  };

  const roleName: any = { admin: 'Administrador', gestor: 'Gestor', inspetor: 'Inspetor' };
  const roleColor: any = { admin: C.dangerDark, gestor: C.infoDark, inspetor: C.successDark };
  const roleBg: any = { admin: C.dangerBg, gestor: C.infoBg, inspetor: C.successBg };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.profileCard}>
          <View style={s.avatarBox}>
            <Text style={s.avatarTxt}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={s.name}>{user?.name}</Text>
          <Text style={s.email}>{user?.email}</Text>
          <View style={[s.roleBadge, { backgroundColor: roleBg[user?.role] || C.infoBg }]}>
            <Text style={[s.roleTxt, { color: roleColor[user?.role] || C.infoDark }]}>
              {roleName[user?.role] || user?.role}
            </Text>
          </View>
          {user?.obra && <Text style={s.obra}>📍 {user.obra}</Text>}
        </View>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statVal}>{myChecklists.length}</Text>
            <Text style={s.statLabel}>Inspeções</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statVal, { color: C.successDark }]}>{myConcluded.length}</Text>
            <Text style={s.statLabel}>Concluídas</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statVal, { color: C.infoDark }]}>{incidents.length}</Text>
            <Text style={s.statLabel}>Incidentes</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>NRs Habilitadas</Text>
          <View style={s.nrGrid}>
            {NRS.map((nr) => (
              <View key={nr} style={s.nrChip}>
                <Text style={s.nrChipTxt}>{nr}</Text>
                <Text style={s.nrCheck}>✓</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Informações da Conta</Text>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Nome</Text>
            <Text style={s.infoVal}>{user?.name}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>E-mail</Text>
            <Text style={s.infoVal}>{user?.email}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Perfil</Text>
            <Text style={s.infoVal}>{roleName[user?.role] || user?.role}</Text>
          </View>
          {user?.obra && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Obra</Text>
              <Text style={s.infoVal}>{user.obra}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutTxt}>🚪 Sair da Conta</Text>
        </TouchableOpacity>

        <View style={s.footer}>
          <Logo size="sm" />
          <Text style={s.footerTxt}>Treinar Engenharia v3.0.0</Text>
          <Text style={s.footerSub}>Praia Grande, SP</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.offWhite },
  scroll: { padding: S.md, paddingBottom: S.xxl },
  profileCard: { backgroundColor: C.black, borderRadius: R.xl, padding: S.xl, alignItems: 'center', marginBottom: S.md, ...Sh.md },
  avatarBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: S.md },
  avatarTxt: { fontSize: F.xxxl, fontWeight: '800', color: C.black },
  name: { fontSize: F.xl, fontWeight: '700', color: C.white },
  email: { fontSize: F.sm, color: C.textMuted, marginTop: S.xs },
  roleBadge: { marginTop: S.sm, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.xs },
  roleTxt: { fontWeight: '700', fontSize: F.sm },
  obra: { fontSize: F.sm, color: C.textMuted, marginTop: S.sm },
  statsRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.md },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: R.xl, padding: S.md, alignItems: 'center', ...Sh.sm },
  statVal: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  statLabel: { fontSize: F.xs, color: C.textSecondary },
  section: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, marginBottom: S.md, ...Sh.sm },
  sectionTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary, marginBottom: S.md },
  nrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  nrChip: { flexDirection: 'row', alignItems: 'center', gap: S.xs, backgroundColor: C.successBg, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: S.xs },
  nrChipTxt: { fontSize: F.xs, fontWeight: '700', color: C.successDark },
  nrCheck: { fontSize: F.xs, color: C.successDark },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabel: { fontSize: F.sm, color: C.textSecondary },
  infoVal: { fontSize: F.sm, fontWeight: '600', color: C.textPrimary },
  logoutBtn: { backgroundColor: C.dangerBg, borderRadius: R.lg, padding: S.md, alignItems: 'center', marginBottom: S.xl, borderWidth: 1, borderColor: C.danger },
  logoutTxt: { fontWeight: '700', fontSize: F.md, color: C.dangerDark },
  footer: { alignItems: 'center', gap: S.xs },
  footerTxt: { fontSize: F.sm, color: C.textMuted, fontWeight: '600' },
  footerSub: { fontSize: F.xs, color: C.textMuted },
});

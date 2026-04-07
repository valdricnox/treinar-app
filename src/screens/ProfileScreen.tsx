import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { RootState, logout } from '../store';
import { C, S, R, F, Sh } from '../theme';

export default function ProfileScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const checklists = useSelector((s: RootState) => s.checklists.items);
  const incidents = useSelector((s: RootState) => s.incidents.items);
  const lastSync = useSelector((s: RootState) => s.app.lastSync);
  const initials = user?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') ?? 'TR';

  const handleLogout = () => Alert.alert('Sair da conta?', 'Você precisará fazer login novamente.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Sair', style: 'destructive', onPress: async () => {
      await SecureStore.deleteItemAsync('token');
      dispatch(logout());
    }},
  ]);

  const stats = [
    { num: checklists.length, label: 'Total inspeções' },
    { num: checklists.filter(c => c.status === 'concluido').length, label: 'Concluídas' },
    { num: incidents.length, label: 'Ocorrências' },
    { num: checklists.filter(c => c.status === 'em_andamento').length, label: 'Em andamento' },
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <Text style={s.name}>{user?.name ?? 'Inspetor'}</Text>
          <Text style={s.email}>{user?.email ?? ''}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>{(user?.role ?? 'inspetor').toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsGrid}>
          {stats.map(st => (
            <View key={st.label} style={s.statCard}>
              <Text style={s.statNum}>{st.num}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Informações */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>INFORMAÇÕES</Text>
          {[
            { icon:'🏗', label:'Obra atual', value: user?.obra ?? 'Não definida' },
            { icon:'🔄', label:'Última sincronização', value: lastSync ? new Date(lastSync).toLocaleString('pt-BR') : 'Nunca' },
            { icon:'📱', label:'Versão do app', value: '2.0.0' },
          ].map(row => (
            <View key={row.label} style={s.infoRow}>
              <Text style={{fontSize:22}}>{row.icon}</Text>
              <View style={{flex:1}}>
                <Text style={s.infoLabel}>{row.label}</Text>
                <Text style={s.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Normas */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>NORMAS HABILITADAS</Text>
          {[
            {nr:'NR-18', desc:'Segurança na construção civil'},
            {nr:'NR-35', desc:'Trabalho em altura'},
            {nr:'NR-6',  desc:'Equipamentos de proteção individual'},
            {nr:'NR-12', desc:'Máquinas e equipamentos'},
          ].map(n => (
            <View key={n.nr} style={s.normaRow}>
              <View style={s.normaBadge}><Text style={s.normaBadgeText}>{n.nr}</Text></View>
              <Text style={s.normaDesc}>{n.desc}</Text>
              <Text style={{color:C.success,fontSize:18}}>✓</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.btnLogout} onPress={handleLogout}>
          <Text style={s.btnLogoutText}>Sair da conta</Text>
        </TouchableOpacity>
        <View style={{height:40}} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.offWhite},
  header:{backgroundColor:C.black,paddingTop:52,paddingHorizontal:S.xl,paddingBottom:S.xxl,alignItems:'center',gap:S.sm},
  avatar:{width:80,height:80,borderRadius:40,backgroundColor:C.yellow,alignItems:'center',justifyContent:'center',marginBottom:S.sm},
  avatarText:{fontSize:F.xl,fontWeight:'700',color:C.black},
  name:{fontSize:F.xl,fontWeight:'700',color:'#fff'},
  email:{fontSize:F.sm,color:C.textMuted},
  roleBadge:{backgroundColor:C.yellow,borderRadius:R.full,paddingHorizontal:S.lg,paddingVertical:4,marginTop:4},
  roleText:{fontSize:F.xs,fontWeight:'700',color:C.black,letterSpacing:1},
  statsGrid:{flexDirection:'row',flexWrap:'wrap',gap:S.md,padding:S.lg},
  statCard:{width:'47%',backgroundColor:C.white,borderRadius:R.lg,padding:S.lg,alignItems:'center',...Sh.sm},
  statNum:{fontSize:F.xxl,fontWeight:'700',color:C.black},
  statLabel:{fontSize:F.xs,color:C.textMuted,textAlign:'center',marginTop:4},
  section:{paddingHorizontal:S.lg,marginBottom:S.xl},
  sectionLabel:{fontSize:F.xs,color:C.textMuted,fontWeight:'700',letterSpacing:1,marginBottom:S.md},
  infoRow:{flexDirection:'row',alignItems:'center',gap:S.md,backgroundColor:C.white,borderRadius:R.md,padding:S.md,marginBottom:S.sm,...Sh.sm},
  infoLabel:{fontSize:F.xs,color:C.textMuted},
  infoValue:{fontSize:F.sm,fontWeight:'700',color:C.textPrimary},
  normaRow:{flexDirection:'row',alignItems:'center',gap:S.md,backgroundColor:C.white,borderRadius:R.md,padding:S.md,marginBottom:S.sm},
  normaBadge:{backgroundColor:C.black,borderRadius:R.full,paddingHorizontal:S.md,paddingVertical:3},
  normaBadgeText:{fontSize:F.xs,color:C.yellow,fontWeight:'700'},
  normaDesc:{flex:1,fontSize:F.sm,color:C.textSecondary},
  btnLogout:{margin:S.xl,borderWidth:2,borderColor:C.danger,borderRadius:R.full,padding:S.lg,alignItems:'center'},
  btnLogoutText:{fontSize:F.base,fontWeight:'700',color:C.danger},
});

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, TextInput, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setChecklists } from '../store';
import { checklistApi } from '../services/api';
import { C, S, R, F, Sh } from '../theme';

const STATUS_CONFIG: Record<string,{label:string;bg:string;text:string}> = {
  pendente:     { label:'Pendente',     bg:'#F0F0EE', text:'#666' },
  em_andamento: { label:'Em andamento', bg:'#FFF9E0', text:'#92400E' },
  concluido:    { label:'Concluído',    bg:'#E6F4EA', text:'#22863A' },
};

export default function ChecklistsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const items = useSelector((s: RootState) => s.checklists.items);
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroNorma, setFiltroNorma] = useState('Todas');
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try { const r = await checklistApi.listar(); dispatch(setChecklists(r.data)); } catch {}
  };
  useEffect(() => { fetch(); }, []);

  const filtered = items.filter(c => {
    const ms = !search || c.titulo.toLowerCase().includes(search.toLowerCase()) || c.obra.toLowerCase().includes(search.toLowerCase());
    const mst = filtroStatus === 'todos' || c.status === filtroStatus;
    const mn = filtroNorma === 'Todas' || c.norma === filtroNorma;
    return ms && mst && mn;
  });

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <View style={s.header}>
        <Text style={s.title}>Checklists</Text>
        <TouchableOpacity style={s.btnNew} onPress={() => navigation.navigate('NewChecklist')}>
          <Text style={s.btnNewText}>+ Nova</Text>
        </TouchableOpacity>
      </View>
      <View style={s.searchWrap}>
        <Text style={{fontSize:16}}>🔍</Text>
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder="Buscar inspeções..." placeholderTextColor={C.textMuted} />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Text style={{color:C.textMuted,fontSize:18}}>✕</Text></TouchableOpacity>}
      </View>
      <View style={s.filterRow}>
        {['Todas','NR-18','NR-35','NR-6','NR-12'].map(n => (
          <TouchableOpacity key={n} style={[s.chip, filtroNorma===n && s.chipActive]} onPress={() => setFiltroNorma(n)}>
            <Text style={[s.chipText, filtroNorma===n && s.chipTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.statusRow}>
        {[['todos','Todos'],['pendente','Pendentes'],['em_andamento','Andamento'],['concluido','Concluídos']].map(([k,l]) => (
          <TouchableOpacity key={k} style={[s.statusChip, filtroStatus===k && s.statusChipActive]} onPress={() => setFiltroStatus(k)}>
            <Text style={[s.statusChipText, filtroStatus===k && s.statusChipTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding:S.lg, paddingBottom:100 }}
        ItemSeparatorComponent={() => <View style={{height:S.md}} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await fetch();setRefreshing(false);}} tintColor={C.yellow} />}
        renderItem={({ item }) => {
          const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pendente;
          return (
            <TouchableOpacity style={s.card} onPress={() => navigation.navigate('ChecklistDetail', {id:item.id})} activeOpacity={0.8}>
              <View style={s.cardTop}>
                <View style={s.normaBadge}><Text style={s.normaBadgeText}>{item.norma}</Text></View>
                <View style={[s.statusBadge, {backgroundColor:st.bg}]}><Text style={[s.statusText, {color:st.text}]}>{st.label}</Text></View>
              </View>
              <Text style={s.cardTitle} numberOfLines={2}>{item.titulo}</Text>
              <Text style={s.cardMeta}>🏗 {item.obra}  👤 {item.responsavel}</Text>
              <View style={s.progressRow}>
                <View style={s.progressBar}><View style={[s.progressFill, {width:`${item.progresso}%` as any}]} /></View>
                <Text style={s.progressText}>{item.progresso}%</Text>
              </View>
              <Text style={s.cardDate}>{new Date(item.dataCriacao).toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{fontSize:52}}>📋</Text>
            <Text style={s.emptyTitle}>Nenhuma inspeção</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('NewChecklist')}>
              <Text style={s.emptyBtnText}>+ Criar Inspeção</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.offWhite},
  header:{backgroundColor:C.black,paddingTop:52,paddingHorizontal:S.xl,paddingBottom:S.lg,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'},
  title:{fontSize:F.xxl,color:'#fff',fontWeight:'700'},
  btnNew:{backgroundColor:C.yellow,borderRadius:R.full,paddingHorizontal:S.lg,paddingVertical:S.sm},
  btnNewText:{fontSize:F.sm,fontWeight:'700',color:C.black},
  searchWrap:{flexDirection:'row',alignItems:'center',margin:S.lg,backgroundColor:C.white,borderRadius:R.lg,paddingHorizontal:S.md,borderWidth:1,borderColor:C.border,gap:S.sm},
  searchInput:{flex:1,paddingVertical:S.md,fontSize:F.md,color:C.textPrimary},
  filterRow:{flexDirection:'row',gap:S.sm,paddingHorizontal:S.lg,marginBottom:S.sm,flexWrap:'wrap'},
  chip:{borderRadius:R.full,paddingHorizontal:S.md,paddingVertical:5,borderWidth:1,borderColor:C.border,backgroundColor:C.white},
  chipActive:{backgroundColor:C.black,borderColor:C.black},
  chipText:{fontSize:F.xs,color:C.textSecondary},
  chipTextActive:{color:C.yellow,fontWeight:'700'},
  statusRow:{flexDirection:'row',gap:6,paddingHorizontal:S.lg,marginBottom:S.md,flexWrap:'wrap'},
  statusChip:{borderRadius:R.full,paddingHorizontal:S.sm,paddingVertical:4,backgroundColor:C.surfaceAlt},
  statusChipActive:{backgroundColor:C.black},
  statusChipText:{fontSize:10,color:C.textMuted},
  statusChipTextActive:{color:C.yellow,fontWeight:'700'},
  card:{backgroundColor:C.white,borderRadius:R.lg,padding:S.lg,...Sh.sm},
  cardTop:{flexDirection:'row',justifyContent:'space-between',marginBottom:S.sm},
  normaBadge:{backgroundColor:C.black,borderRadius:R.full,paddingHorizontal:S.md,paddingVertical:3},
  normaBadgeText:{fontSize:F.xs,color:C.yellow,fontWeight:'700'},
  statusBadge:{borderRadius:R.full,paddingHorizontal:S.md,paddingVertical:3},
  statusText:{fontSize:F.xs,fontWeight:'700'},
  cardTitle:{fontSize:F.base,fontWeight:'700',color:C.textPrimary,marginBottom:4},
  cardMeta:{fontSize:F.sm,color:C.textSecondary,marginBottom:S.md},
  progressRow:{flexDirection:'row',alignItems:'center',gap:S.sm,marginBottom:S.sm},
  progressBar:{flex:1,height:6,backgroundColor:C.surfaceAlt,borderRadius:3,overflow:'hidden'},
  progressFill:{height:6,backgroundColor:C.yellow,borderRadius:3},
  progressText:{fontSize:F.xs,fontWeight:'700',color:C.textSecondary,minWidth:32,textAlign:'right'},
  cardDate:{fontSize:F.xs,color:C.textMuted},
  empty:{alignItems:'center',padding:S.xxxl,gap:S.md},
  emptyTitle:{fontSize:F.xl,fontWeight:'700',color:C.textPrimary},
  emptyBtn:{backgroundColor:C.yellow,borderRadius:R.full,paddingHorizontal:S.xl,paddingVertical:S.md},
  emptyBtnText:{fontSize:F.sm,fontWeight:'700',color:C.black},
});

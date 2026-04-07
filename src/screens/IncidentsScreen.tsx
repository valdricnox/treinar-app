import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setIncidents } from '../store';
import { incidentApi } from '../services/api';
import { C, S, R, F, Sh } from '../theme';

export default function IncidentsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const items = useSelector((s: RootState) => s.incidents.items);
  const [filtro, setFiltro] = useState('todos');
  const [refreshing, setRefreshing] = useState(false);
  const fetch = async () => { try { const r = await incidentApi.listar(); dispatch(setIncidents(r.data)); } catch {} };
  useEffect(() => { fetch(); }, []);

  const sevColor: Record<string,string> = { alta: C.danger, media: C.warning, baixa: C.success };
  const sevBg:    Record<string,string> = { alta: C.dangerLight, media: C.warningLight, baixa: C.successLight };
  const filtered = items.filter(i => filtro === 'todos' || i.status === filtro);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.dangerMed} />
      <View style={s.header}>
        <Text style={s.title}>Incidentes</Text>
        <TouchableOpacity style={s.btnNew} onPress={() => navigation.navigate('NewIncident')}>
          <Text style={s.btnNewText}>+ Reportar</Text>
        </TouchableOpacity>
      </View>
      <View style={s.statsRow}>
        {[
          {num:items.length,label:'Total',color:C.textPrimary},
          {num:items.filter(i=>i.status==='aberto').length,label:'Abertos',color:C.danger},
          {num:items.filter(i=>i.severidade==='alta'&&i.status==='aberto').length,label:'Críticos',color:C.dangerMed},
          {num:items.filter(i=>i.status==='resolvido').length,label:'Resolvidos',color:C.success},
        ].map(st => (
          <View key={st.label} style={s.stat}><Text style={[s.statNum,{color:st.color}]}>{st.num}</Text><Text style={s.statLabel}>{st.label}</Text></View>
        ))}
      </View>
      <View style={s.filterRow}>
        {[['todos','Todos'],['aberto','Abertos'],['em_tratamento','Em tratamento'],['resolvido','Resolvidos']].map(([k,l]) => (
          <TouchableOpacity key={k} style={[s.chip,filtro===k&&s.chipActive]} onPress={() => setFiltro(k)}>
            <Text style={[s.chipText,filtro===k&&s.chipTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{padding:S.lg,paddingBottom:100}}
        ItemSeparatorComponent={() => <View style={{height:S.md}} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await fetch();setRefreshing(false);}} tintColor={C.yellow} />}
        renderItem={({ item }) => (
          <View style={[s.card, item.severidade==='alta'&&{borderLeftWidth:4,borderLeftColor:C.danger}]}>
            <View style={s.cardTop}>
              <View style={[s.sevBadge,{backgroundColor:sevBg[item.severidade]||C.surfaceAlt}]}>
                <Text style={[s.sevText,{color:sevColor[item.severidade]||C.textMuted}]}>● {(item.severidade||'').toUpperCase()}</Text>
              </View>
              <Text style={[s.stText,{color:item.status==='resolvido'?C.success:item.status==='em_tratamento'?C.warning:C.danger}]}>
                {item.status==='resolvido'?'Resolvido':item.status==='em_tratamento'?'Em tratamento':'Aberto'}
              </Text>
            </View>
            <Text style={s.cardTitle}>{item.titulo}</Text>
            <Text style={s.cardDesc} numberOfLines={2}>{item.descricao}</Text>
            <Text style={s.cardMeta}>📍 {item.local}  👤 {item.responsavel}</Text>
            <Text style={s.cardDate}>{new Date(item.dataCriacao).toLocaleDateString('pt-BR')}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={{alignItems:'center',padding:40,gap:12}}>
            <Text style={{fontSize:52}}>✅</Text>
            <Text style={{fontSize:18,fontWeight:'700',color:C.textPrimary}}>Tudo sob controle!</Text>
            <Text style={{fontSize:14,color:C.textMuted,textAlign:'center'}}>Nenhum incidente registrado</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.offWhite},
  header:{backgroundColor:C.dangerMed,paddingTop:52,paddingHorizontal:S.xl,paddingBottom:S.lg,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'},
  title:{fontSize:F.xxl,color:'#fff',fontWeight:'700'},
  btnNew:{backgroundColor:'#fff',borderRadius:R.full,paddingHorizontal:S.lg,paddingVertical:S.sm},
  btnNewText:{fontSize:F.sm,fontWeight:'700',color:C.dangerMed},
  statsRow:{flexDirection:'row',gap:S.sm,padding:S.lg},
  stat:{flex:1,backgroundColor:C.white,borderRadius:R.lg,padding:S.md,alignItems:'center',...Sh.sm},
  statNum:{fontSize:F.xl,fontWeight:'700'},
  statLabel:{fontSize:9,color:C.textMuted,textAlign:'center',marginTop:2},
  filterRow:{flexDirection:'row',gap:6,paddingHorizontal:S.lg,marginBottom:S.md,flexWrap:'wrap'},
  chip:{borderRadius:R.full,paddingHorizontal:S.md,paddingVertical:5,backgroundColor:C.white,borderWidth:1,borderColor:C.border},
  chipActive:{backgroundColor:C.black,borderColor:C.black},
  chipText:{fontSize:F.xs,color:C.textSecondary},
  chipTextActive:{color:C.yellow,fontWeight:'700'},
  card:{backgroundColor:C.white,borderRadius:R.lg,padding:S.lg,...Sh.sm},
  cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:S.sm},
  sevBadge:{borderRadius:R.full,paddingHorizontal:S.md,paddingVertical:4},
  sevText:{fontSize:F.xs,fontWeight:'700'},
  stText:{fontSize:F.xs,fontWeight:'700'},
  cardTitle:{fontSize:F.base,fontWeight:'700',color:C.textPrimary,marginBottom:4},
  cardDesc:{fontSize:F.sm,color:C.textSecondary,marginBottom:S.sm},
  cardMeta:{fontSize:F.xs,color:C.textMuted,marginBottom:4},
  cardDate:{fontSize:F.xs,color:C.textDisabled},
});

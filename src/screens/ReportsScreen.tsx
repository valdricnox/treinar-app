import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, Alert, Share } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { checklistApi } from '../services/api';
import { C, S, R, F, Sh } from '../theme';

export default function ReportsScreen({ navigation }: any) {
  const checklists = useSelector((s: RootState) => s.checklists.items);
  const concluidos = checklists.filter(c => c.status === 'concluido');

  const handlePdf = async (id: string, titulo: string) => {
    try {
      await checklistApi.gerarPdf(id);
      Alert.alert('✅ PDF gerado!', `Relatório de "${titulo}" pronto.`, [
        { text: 'Compartilhar', onPress: () => Share.share({ message: `Relatório: ${titulo} — Treinar Engenharia` }) },
        { text: 'OK' },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o PDF. Verifique a conexão.');
    }
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <View style={s.header}>
        <Text style={s.title}>Relatórios</Text>
        <Text style={s.sub}>{concluidos.length} inspeção{concluidos.length !== 1 ? 'ões' : ''} concluída{concluidos.length !== 1 ? 's' : ''}</Text>
      </View>

      <View style={s.infoCard}>
        <Text style={{fontSize:22}}>📄</Text>
        <View style={{flex:1}}>
          <Text style={s.infoTitle}>PDFs com marca Treinar Engenharia</Text>
          <Text style={s.infoSub}>Gerados automaticamente ao concluir inspeções. Inclui itens, observações e data.</Text>
        </View>
      </View>

      <FlatList
        data={concluidos}
        keyExtractor={i => i.id}
        contentContainerStyle={{padding:S.lg, paddingBottom:100}}
        ItemSeparatorComponent={() => <View style={{height:S.md}} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={s.normaBadge}><Text style={s.normaBadgeText}>{item.norma}</Text></View>
              <View style={s.concluidoBadge}><Text style={s.concluidoText}>✅ Concluído</Text></View>
            </View>
            <Text style={s.cardTitle}>{item.titulo}</Text>
            <Text style={s.cardMeta}>🏗 {item.obra}</Text>
            <Text style={s.cardMeta}>👤 {item.responsavel}</Text>
            <Text style={s.cardDate}>{new Date(item.dataCriacao).toLocaleDateString('pt-BR')}</Text>
            <View style={s.cardStats}>
              <Text style={s.statText}>📋 {item.itens.length} itens</Text>
              <Text style={s.statText}>✓ {item.itens.filter(i=>i.checked).length} conformes</Text>
              <Text style={s.statText}>💬 {item.itens.filter(i=>i.nota).length} observações</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.btnPdf} onPress={() => handlePdf(item.id, item.titulo)}>
                <Text style={s.btnPdfText}>📄 Gerar PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnShare} onPress={() => Share.share({message:`Inspeção ${item.norma}: ${item.titulo} — Treinar Engenharia`})}>
                <Text style={s.btnShareText}>↗ Compartilhar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{alignItems:'center',padding:48,gap:12}}>
            <Text style={{fontSize:52}}>📋</Text>
            <Text style={{fontSize:18,fontWeight:'700',color:C.textPrimary}}>Nenhum relatório</Text>
            <Text style={{fontSize:14,color:C.textMuted,textAlign:'center'}}>Conclua uma inspeção para gerar o primeiro relatório PDF</Text>
            <TouchableOpacity style={{backgroundColor:C.yellow,borderRadius:R.full,paddingHorizontal:24,paddingVertical:10,marginTop:8}} onPress={() => navigation.navigate('NewChecklist')}>
              <Text style={{fontSize:14,fontWeight:'700',color:C.black}}>+ Criar Inspeção</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.offWhite},
  header:{backgroundColor:C.black,paddingTop:52,paddingHorizontal:S.xl,paddingBottom:S.xl},
  title:{fontSize:F.xxl,color:'#fff',fontWeight:'700'},
  sub:{fontSize:F.sm,color:C.textMuted,marginTop:4},
  infoCard:{flexDirection:'row',alignItems:'flex-start',gap:S.md,backgroundColor:C.infoLight,margin:S.lg,borderRadius:R.lg,padding:S.md,borderWidth:1,borderColor:C.info+'30'},
  infoTitle:{fontSize:F.sm,fontWeight:'700',color:C.info},
  infoSub:{fontSize:F.xs,color:C.textSecondary,marginTop:2,lineHeight:16},
  card:{backgroundColor:C.white,borderRadius:R.lg,padding:S.lg,...Sh.sm},
  cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:S.sm},
  normaBadge:{backgroundColor:C.black,borderRadius:R.full,paddingHorizontal:S.md,paddingVertical:3},
  normaBadgeText:{fontSize:F.xs,color:C.yellow,fontWeight:'700'},
  concluidoBadge:{backgroundColor:C.successLight,borderRadius:R.full,paddingHorizontal:S.md,paddingVertical:3},
  concluidoText:{fontSize:F.xs,color:C.success,fontWeight:'700'},
  cardTitle:{fontSize:F.base,fontWeight:'700',color:C.textPrimary,marginBottom:4},
  cardMeta:{fontSize:F.sm,color:C.textSecondary,marginBottom:2},
  cardDate:{fontSize:F.xs,color:C.textMuted,marginBottom:S.sm},
  cardStats:{flexDirection:'row',gap:S.lg,marginBottom:S.md,padding:S.sm,backgroundColor:C.surfaceAlt,borderRadius:R.sm},
  statText:{fontSize:F.xs,color:C.textSecondary},
  actions:{flexDirection:'row',gap:S.md},
  btnPdf:{flex:1,backgroundColor:C.yellow,borderRadius:R.full,padding:S.sm,alignItems:'center'},
  btnPdfText:{fontSize:F.sm,fontWeight:'700',color:C.black},
  btnShare:{flex:1,backgroundColor:C.surfaceAlt,borderRadius:R.full,padding:S.sm,alignItems:'center',borderWidth:1,borderColor:C.border},
  btnShareText:{fontSize:F.sm,fontWeight:'700',color:C.textSecondary},
});

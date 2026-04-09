import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IcPDF, IcCheck, IcPin, IcPerson, IcSign } from '../components/Icons';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

export default function ReportsScreen() {
  const checklists = useSelector((s: RootState) => s.checklists.list);
  const incidents = useSelector((s: RootState) => s.incidents.list);
  const concluidos = checklists.filter((c: any) => c.status === 'concluido');
  const [loadingId, setLoadingId] = useState<any>(null);

  const gerarPDF = async (item: any) => {
    setLoadingId(item.id);
    try {
      const res = await api.post(`/checklists/${item.id}/pdf`);
      const url = res.data?.pdf_url || res.data?.url;
      Alert.alert('📄 PDF Gerado', url ? `Disponível em:\n${url}` : 'Relatório gerado com sucesso no servidor!');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Não foi possível gerar o PDF. O servidor pode estar processando.';
      Alert.alert('Erro ao gerar PDF', msg);
    } finally {
      setLoadingId(null);
    }
  };

  // Stats gerais
  const totalInsp = checklists.length;
  const conformidade = totalInsp > 0 ? Math.round((concluidos.length / totalInsp) * 100) : 0;
  const incCriticos = incidents.filter((i: any) => i.severidade === 'critico').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Relatórios</Text>
        <Text style={s.subtitle}>{concluidos.length} inspeções concluídas</Text>
      </View>

      {/* Resumo geral */}
      <View style={s.summaryCard}>
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>{totalInsp}</Text>
          <Text style={s.summaryLabel}>Total</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryVal, { color: C.success }]}>{concluidos.length}</Text>
          <Text style={s.summaryLabel}>Concluídas</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryVal, { color: C.primary }]}>{conformidade}%</Text>
          <Text style={s.summaryLabel}>Conformidade</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryVal, { color: C.danger }]}>{incCriticos}</Text>
          <Text style={s.summaryLabel}>Inc. Críticos</Text>
        </View>
      </View>

      <FlatList
        data={concluidos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <IcPDF color={C.gray300} size={48} />
            <Text style={s.emptyTxt}>Nenhuma inspeção concluída</Text>
            <Text style={s.emptySub}>Complete inspeções para gerar relatórios em PDF</Text>
          </View>
        }
        renderItem={({ item }) => {
          const data = item.data_conclusao || item.data_criacao;
          const dataFmt = data ? new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
          const isLoading = loadingId === item.id;

          return (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={s.nrBadge}>
                  <Text style={s.nrTxt}>{item.norma}</Text>
                </View>
                <View style={s.concBadge}>
                  <Text style={s.concTxt}>Concluído</Text>
                </View>
                <Text style={s.cardDate}>{dataFmt}</Text>
              </View>

              <Text style={s.cardTitle} numberOfLines={2}>{item.titulo}</Text>

              <View style={s.cardMeta}>
                <Text style={s.metaItem}>{item.obra || '—'}</Text>
                <Text style={s.metaDot}>·</Text>
                <Text style={s.metaItem}>{item.responsavel || '—'}</Text>
              </View>

              {/* Barra de progresso */}
              <View style={s.progRow}>
                <View style={s.progBg}>
                  <View style={[s.progFill, { width: `${item.progresso || 100}%` }]} />
                </View>
                <Text style={s.progTxt}>{item.progresso || 100}%</Text>
              </View>

              {/* Assinatura se houver */}
              {item.assinatura ? (
                <View style={s.assinaturaRow}>
                  <IcSign color={C.textTertiary} size={16} />
                  <Text style={s.assinaturaTxt}>Assinado por: {item.assinatura}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.pdfBtn, isLoading && { opacity: 0.7 }]}
                onPress={() => gerarPDF(item)}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color={C.black} size="small" />
                  : (
                    <>
                      <Text style={s.pdfBtnEmoji}>📄</Text>
                      <Text style={s.pdfBtnTxt}>Gerar PDF</Text>
                    </>
                  )
                }
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { padding: S.md, paddingBottom: S.sm },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: F.sm, color: C.textTertiary, marginTop: 2 },

  summaryCard: {
    flexDirection: 'row', backgroundColor: C.black,
    marginHorizontal: S.md, marginBottom: S.sm,
    borderRadius: R.xxl, padding: S.md, ...Sh.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: F.xxl, fontWeight: '900', color: C.white },
  summaryLabel: { fontSize: F.xs, color: C.gray500, marginTop: 2, fontWeight: '600' },
  summaryDivider: { width: 1, backgroundColor: C.gray800, marginVertical: S.xs },

  list: { padding: S.md, gap: S.sm, paddingBottom: 100 },

  emptyBox: { alignItems: 'center', padding: S.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: S.md },
  emptyTxt: { fontSize: F.lg, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: F.sm, color: C.textTertiary, textAlign: 'center', marginTop: S.xs },

  card: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, ...Sh.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  nrBadge: { backgroundColor: C.black, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  nrTxt: { color: C.primary, fontSize: F.xs, fontWeight: '800' },
  concBadge: { backgroundColor: C.successBg, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  concTxt: { color: C.successDark, fontSize: F.xs, fontWeight: '700' },
  cardDate: { fontSize: F.xs, color: C.textTertiary, marginLeft: 'auto' },
  cardTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary, marginBottom: S.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.sm },
  metaItem: { fontSize: F.xs, color: C.textTertiary },
  metaDot: { color: C.textTertiary },
  progRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  progBg: { flex: 1, height: 5, backgroundColor: C.gray200, borderRadius: R.full, overflow: 'hidden' },
  progFill: { height: 5, backgroundColor: C.success, borderRadius: R.full },
  progTxt: { fontSize: F.xs, fontWeight: '800', color: C.successDark, width: 34, textAlign: 'right' },
  assinaturaRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.sm },

  assinaturaTxt: { fontSize: F.xs, color: C.textTertiary, fontStyle: 'italic' },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, backgroundColor: C.primary, borderRadius: R.lg, padding: S.sm + 2, ...Sh.colored },

  pdfBtnTxt: { fontWeight: '800', fontSize: F.sm, color: C.black },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

export default function ReportsScreen() {
  const checklists = useSelector((s: RootState) => s.checklists.list);
  const concluidos = checklists.filter((c: any) => c.status === 'concluido');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const gerarPDF = async (item: any) => {
    setLoadingId(item.id);
    try {
      const res = await api.post(`/checklists/${item.id}/pdf`);
      Alert.alert('PDF Gerado', 'Relatório gerado com sucesso!\n\nURL: ' + (res.data?.pdf_url || 'Disponível no servidor'));
    } catch (err: any) {
      Alert.alert('Erro', 'Não foi possível gerar o PDF. Verifique sua conexão com o servidor.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Relatórios</Text>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{concluidos.length} concluídas</Text>
        </View>
      </View>

      <FlatList
        data={concluidos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTxt}>Nenhuma inspeção concluída ainda.</Text>
            <Text style={s.emptySub}>Complete uma inspeção para gerar relatórios.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={s.nrBadge}><Text style={s.nrTxt}>{item.norma}</Text></View>
              <Text style={s.cardDate}>{new Date(item.data_conclusao || item.data_criacao).toLocaleDateString('pt-BR')}</Text>
            </View>
            <Text style={s.cardTitle} numberOfLines={2}>{item.titulo}</Text>
            <Text style={s.cardSub}>📍 {item.obra} • 👤 {item.responsavel}</Text>
            <View style={s.cardFooter}>
              <View style={s.progRow}>
                <View style={s.progBg}><View style={[s.progFill, { width: `${item.progresso || 100}%` }]} /></View>
                <Text style={s.progTxt}>{item.progresso || 100}%</Text>
              </View>
              <TouchableOpacity
                style={[s.pdfBtn, loadingId === item.id && { opacity: 0.7 }]}
                onPress={() => gerarPDF(item)}
                disabled={loadingId === item.id}
              >
                {loadingId === item.id
                  ? <ActivityIndicator color={C.black} size="small" />
                  : <Text style={s.pdfBtnTxt}>📄 PDF</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.offWhite },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: S.md },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  badge: { backgroundColor: C.successBg, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: S.xs },
  badgeTxt: { fontSize: F.xs, fontWeight: '600', color: C.successDark },
  list: { padding: S.md, gap: S.sm, paddingBottom: S.xxl },
  emptyBox: { alignItems: 'center', marginTop: S.xxl, padding: S.xl },
  emptyIcon: { fontSize: 48, marginBottom: S.md },
  emptyTxt: { fontSize: F.lg, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: F.sm, color: C.textSecondary, textAlign: 'center', marginTop: S.xs },
  card: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, ...Sh.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm },
  nrBadge: { backgroundColor: C.black, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 2 },
  nrTxt: { color: C.primary, fontSize: F.xs, fontWeight: '700' },
  cardDate: { fontSize: F.xs, color: C.textMuted },
  cardTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary, marginBottom: S.xs },
  cardSub: { fontSize: F.xs, color: C.textSecondary, marginBottom: S.sm },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  progRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.sm },
  progBg: { flex: 1, height: 6, backgroundColor: C.border, borderRadius: R.full, overflow: 'hidden' },
  progFill: { height: 6, backgroundColor: C.success, borderRadius: R.full },
  progTxt: { fontSize: F.xs, fontWeight: '700', color: C.successDark },
  pdfBtn: { backgroundColor: C.primary, borderRadius: R.md, paddingHorizontal: S.md, paddingVertical: S.sm, ...Sh.sm },
  pdfBtnTxt: { fontWeight: '700', fontSize: F.sm, color: C.black },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { addChecklist, RootState } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

const NR_TEMPLATES: any = {
  'NR-6': {
    label: 'NR-6 — Equipamentos de Proteção Individual',
    itens: [
      { texto: 'EPIs adequados disponíveis para todos os trabalhadores', conforme: false },
      { texto: 'EPIs estão dentro do prazo de validade', conforme: false },
      { texto: 'CA (Certificado de Aprovação) válido para todos os EPIs', conforme: false },
      { texto: 'Trabalhadores foram treinados para uso correto dos EPIs', conforme: false },
      { texto: 'Registro de entrega de EPIs assinado pelos trabalhadores', conforme: false },
      { texto: 'EPIs armazenados adequadamente', conforme: false },
      { texto: 'EPIs danificados substituídos imediatamente', conforme: false },
      { texto: 'Higienização dos EPIs realizada conforme norma', conforme: false },
    ],
  },
  'NR-10': {
    label: 'NR-10 — Segurança em Instalações e Serviços com Eletricidade',
    itens: [
      { texto: 'Trabalhadores com treinamento NR-10 atualizado', conforme: false },
      { texto: 'Quadros elétricos identificados e sinalizados', conforme: false },
      { texto: 'Distâncias de segurança respeitadas', conforme: false },
      { texto: 'Ferramentas isoladas para trabalhos elétricos', conforme: false },
      { texto: 'Equipamentos de proteção elétrica disponíveis (luvas, capacetes)', conforme: false },
      { texto: 'Procedimentos de bloqueio e etiquetagem (LOTO) implementados', conforme: false },
      { texto: 'Instalações elétricas em conformidade com ABNT', conforme: false },
      { texto: 'Aterramento das instalações verificado', conforme: false },
    ],
  },
  'NR-12': {
    label: 'NR-12 — Segurança em Máquinas e Equipamentos',
    itens: [
      { texto: 'Proteções fixas e móveis instaladas nas máquinas', conforme: false },
      { texto: 'Dispositivos de parada de emergência funcionando', conforme: false },
      { texto: 'Distâncias de segurança respeitadas', conforme: false },
      { texto: 'Sinalização de segurança nas máquinas', conforme: false },
      { texto: 'Manual de operação disponível em português', conforme: false },
      { texto: 'Trabalhadores treinados para operação segura', conforme: false },
      { texto: 'Manutenção preventiva em dia', conforme: false },
      { texto: 'Laudo de conformidade das máquinas atualizado', conforme: false },
    ],
  },
  'NR-18': {
    label: 'NR-18 — Condições e Meio Ambiente de Trabalho na Indústria da Construção',
    itens: [
      { texto: 'PCMAT elaborado e implementado', conforme: false },
      { texto: 'Instalações sanitárias adequadas (banheiros, vestiários)', conforme: false },
      { texto: 'Refeitório e local para refeição disponíveis', conforme: false },
      { texto: 'Andaimes e escadas em boas condições', conforme: false },
      { texto: 'Redes de proteção instaladas', conforme: false },
      { texto: 'Sinalização do canteiro de obras', conforme: false },
      { texto: 'Almoxarifado organizado e seguro', conforme: false },
      { texto: 'Trabalhadores com NR-18 em dia', conforme: false },
      { texto: 'Descarte correto de resíduos da construção', conforme: false },
    ],
  },
  'NR-23': {
    label: 'NR-23 — Proteção Contra Incêndios',
    itens: [
      { texto: 'Extintores de incêndio disponíveis e dentro do prazo', conforme: false },
      { texto: 'Sinalização de saídas de emergência visível', conforme: false },
      { texto: 'Rotas de fuga desobstruídas', conforme: false },
      { texto: 'Hidrantes e mangueiras em boas condições', conforme: false },
      { texto: 'Treinamento de combate a incêndio realizado', conforme: false },
      { texto: 'Brigada de incêndio formada e treinada', conforme: false },
      { texto: 'Planta de evacuação afixada nos locais', conforme: false },
      { texto: 'Materiais inflamáveis armazenados corretamente', conforme: false },
    ],
  },
  'NR-33': {
    label: 'NR-33 — Segurança e Saúde em Espaços Confinados',
    itens: [
      { texto: 'Espaços confinados identificados e cadastrados', conforme: false },
      { texto: 'Permissão de Entrada e Trabalho (PET) emitida', conforme: false },
      { texto: 'Vigias treinados e designados', conforme: false },
      { texto: 'Equipamentos de monitoramento de gases disponíveis', conforme: false },
      { texto: 'Equipamentos de resgate disponíveis', conforme: false },
      { texto: 'Ventilação adequada do espaço', conforme: false },
      { texto: 'Comunicação contínua entre entrador e vigia', conforme: false },
      { texto: 'Trabalhadores com NR-33 atualizado', conforme: false },
    ],
  },
  'NR-35': {
    label: 'NR-35 — Trabalho em Altura',
    itens: [
      { texto: 'Trabalhadores com treinamento NR-35 atualizado', conforme: false },
      { texto: 'Cinturão tipo paraquedista com CA válido', conforme: false },
      { texto: 'Trava-quedas e talabarte em boas condições', conforme: false },
      { texto: 'Pontos de ancoragem adequados e identificados', conforme: false },
      { texto: 'Plano de Resgate elaborado e comunicado', conforme: false },
      { texto: 'Análise de Risco realizada antes da atividade', conforme: false },
      { texto: 'Sinalização da área de trabalho em altura', conforme: false },
      { texto: 'Condições climáticas avaliadas (vento, chuva)', conforme: false },
    ],
  },
};

export default function NewChecklistScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const [titulo, setTitulo] = useState('');
  const [norma, setNorma] = useState('NR-35');
  const [obra, setObra] = useState('');
  const [loading, setLoading] = useState(false);

  const criar = async () => {
    if (!titulo.trim() || !obra.trim()) {
      Alert.alert('Atenção', 'Preencha o título e a obra.');
      return;
    }
    setLoading(true);
    const template = NR_TEMPLATES[norma];
    const payload = {
      titulo: titulo.trim(),
      norma,
      obra: obra.trim(),
      responsavel: user?.name,
      user_id: user?.id,
      itens: template.itens,
      status: 'em_andamento',
      progresso: 0,
    };
    try {
      const res = await api.post('/checklists', payload);
      dispatch(addChecklist(res.data?.checklist || { ...payload, id: Date.now() }));
      Alert.alert('Sucesso!', 'Checklist criado.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o checklist. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const template = NR_TEMPLATES[norma];

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.pageTitle}>Nova Inspeção</Text>

        <View style={s.card}>
          <Text style={s.label}>Título da Inspeção *</Text>
          <TextInput
            style={s.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ex: Inspeção NR-35 Obra Centro"
            placeholderTextColor={C.textMuted}
          />

          <Text style={s.label}>Norma Regulamentadora *</Text>
          <View style={s.nrGrid}>
            {Object.keys(NR_TEMPLATES).map((nr) => (
              <TouchableOpacity
                key={nr}
                style={[s.nrOption, norma === nr && s.nrOptionActive]}
                onPress={() => setNorma(nr)}
              >
                <Text style={[s.nrOptionTxt, norma === nr && s.nrOptionActiveTxt]}>{nr}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Obra / Local *</Text>
          <TextInput
            style={s.input}
            value={obra}
            onChangeText={setObra}
            placeholder="Nome da obra ou local"
            placeholderTextColor={C.textMuted}
          />
        </View>

        <View style={s.previewCard}>
          <Text style={s.previewTitle}>📋 {template.label}</Text>
          <Text style={s.previewSub}>{template.itens.length} itens de verificação</Text>
          {template.itens.slice(0, 4).map((item: any, i: number) => (
            <View key={i} style={s.previewItem}>
              <View style={s.previewDot} />
              <Text style={s.previewItemTxt} numberOfLines={1}>{item.texto}</Text>
            </View>
          ))}
          {template.itens.length > 4 && (
            <Text style={s.previewMore}>+{template.itens.length - 4} itens a mais...</Text>
          )}
        </View>

        <TouchableOpacity style={s.btn} onPress={criar} disabled={loading}>
          {loading ? <ActivityIndicator color={C.black} /> : <Text style={s.btnTxt}>✅ Criar Checklist</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.offWhite },
  scroll: { padding: S.md, paddingBottom: S.xxl },
  pageTitle: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },
  card: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, marginBottom: S.md, ...Sh.sm },
  label: { fontSize: F.sm, fontWeight: '600', color: C.textSecondary, marginBottom: S.xs, marginTop: S.sm },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    padding: S.md, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.offWhite,
  },
  nrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.sm },
  nrOption: { paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.offWhite },
  nrOptionActive: { backgroundColor: C.black, borderColor: C.black },
  nrOptionTxt: { fontSize: F.sm, fontWeight: '600', color: C.textSecondary },
  nrOptionActiveTxt: { color: C.primary },
  previewCard: { backgroundColor: C.black, borderRadius: R.xl, padding: S.md, marginBottom: S.md, ...Sh.md },
  previewTitle: { fontSize: F.sm, fontWeight: '700', color: C.white, marginBottom: S.xs },
  previewSub: { fontSize: F.xs, color: C.textMuted, marginBottom: S.sm },
  previewItem: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.xs },
  previewDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  previewItemTxt: { fontSize: F.xs, color: C.textMuted, flex: 1 },
  previewMore: { fontSize: F.xs, color: C.primary, marginTop: S.xs },
  btn: { backgroundColor: C.primary, borderRadius: R.lg, padding: S.md + 2, alignItems: 'center', ...Sh.sm },
  btnTxt: { fontWeight: '700', fontSize: F.md, color: C.black },
});

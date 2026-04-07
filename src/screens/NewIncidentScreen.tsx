import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addIncident, RootState } from '../store';
import { incidentApi } from '../services/api';
import { C, S, R, F, Sh } from '../theme';

export default function NewIncidentScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [sev, setSev] = useState<'alta'|'media'|'baixa'>('media');
  const [tipo, setTipo] = useState('nao_conformidade');
  const [local, setLocal] = useState('');
  const [acao, setAcao] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!titulo.trim() || !descricao.trim() || !local.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha título, descrição e local.');
      return;
    }
    setLoading(true);
    const payload = {
      id: Date.now().toString(),
      titulo: titulo.trim(), descricao: descricao.trim(),
      severidade: sev, tipo, local: local.trim(),
      obra: user?.obra ?? '', responsavel: user?.name ?? '',
      status: 'aberto' as const, fotos: [],
      acao: acao.trim() || undefined,
      dataCriacao: new Date().toISOString(), syncPendente: false,
    };
    try {
      const res = await incidentApi.criar(payload);
      dispatch(addIncident({...payload, id: res.data.id ?? payload.id, syncPendente: false}));
      Alert.alert('✅ Incidente reportado!', sev==='alta'?'Gestor notificado imediatamente.':'Registrado com sucesso.');
      navigation.goBack();
    } catch {
      dispatch(addIncident(payload));
      Alert.alert('Salvo localmente', 'Será sincronizado quando houver conexão.');
      navigation.goBack();
    } finally { setLoading(false); }
  };

  const SEV = [
    {k:'alta'  as const, label:'Alta',  emoji:'🔴', color:C.danger},
    {k:'media' as const, label:'Média', emoji:'🟡', color:C.warning},
    {k:'baixa' as const, label:'Baixa', emoji:'🟢', color:C.success},
  ];
  const TIPOS = [
    {k:'nao_conformidade',l:'Não-conformidade'},
    {k:'acidente',l:'Acidente'},
    {k:'quase_acidente',l:'Quase-acidente'},
    {k:'observacao',l:'Observação'},
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.dangerMed} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{alignSelf:'flex-end',marginBottom:S.sm}}>
          <Text style={{color:'rgba(255,255,255,0.8)',fontSize:F.sm}}>✕ Fechar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Reportar Incidente</Text>
        <Text style={s.sub}>Registro de não-conformidades e ocorrências</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding:S.lg,paddingBottom:120}}>
        <Text style={s.label}>SEVERIDADE *</Text>
        <View style={{flexDirection:'row',gap:S.md,marginBottom:S.md}}>
          {SEV.map(o => (
            <TouchableOpacity key={o.k} style={[s.sevBtn, sev===o.k && {backgroundColor:o.color,borderColor:o.color}]} onPress={() => setSev(o.k)}>
              <Text style={{fontSize:18}}>{o.emoji}</Text>
              <Text style={[{fontSize:F.sm,fontWeight:'700',color:C.textPrimary}, sev===o.k && {color:'#fff'}]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>TIPO DE OCORRÊNCIA *</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:S.sm,marginBottom:S.md}}>
          {TIPOS.map(o => (
            <TouchableOpacity key={o.k} style={[s.tipoBtn, tipo===o.k && s.tipoBtnActive]} onPress={() => setTipo(o.k)}>
              <Text style={[s.tipoText, tipo===o.k && {color:C.yellow}]}>{o.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>TÍTULO *</Text>
        <TextInput style={s.input} value={titulo} onChangeText={setTitulo} placeholder="Ex: Trabalhador sem capacete na área de risco" placeholderTextColor={C.textMuted} />

        <Text style={s.label}>DESCRIÇÃO DETALHADA *</Text>
        <TextInput style={[s.input,{minHeight:100}]} value={descricao} onChangeText={setDescricao} placeholder="Descreva o que foi observado, onde, como e quem estava envolvido..." placeholderTextColor={C.textMuted} multiline numberOfLines={4} textAlignVertical="top" />

        <Text style={s.label}>LOCAL *</Text>
        <TextInput style={s.input} value={local} onChangeText={setLocal} placeholder="Ex: Bloco C, 3° andar, próximo ao elevador" placeholderTextColor={C.textMuted} />

        <Text style={s.label}>AÇÃO IMEDIATA TOMADA</Text>
        <TextInput style={[s.input,{minHeight:80}]} value={acao} onChangeText={setAcao} placeholder="Ação corretiva tomada imediatamente..." placeholderTextColor={C.textMuted} multiline numberOfLines={3} textAlignVertical="top" />

        {sev === 'alta' && (
          <View style={{flexDirection:'row',alignItems:'center',gap:S.md,backgroundColor:C.dangerLight,borderRadius:R.md,padding:S.md,marginTop:S.lg}}>
            <Text style={{fontSize:20}}>🚨</Text>
            <Text style={{flex:1,fontSize:F.sm,color:C.danger,lineHeight:18}}>Incidente CRÍTICO — o gestor será notificado imediatamente após o envio.</Text>
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.btnSubmit, sev==='alta' && {backgroundColor:C.danger}]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnSubmitText}>⚡ Enviar Reporte</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.offWhite},
  header:{backgroundColor:C.dangerMed,paddingTop:52,paddingHorizontal:S.xl,paddingBottom:S.xl},
  title:{fontSize:F.xxl,color:'#fff',fontWeight:'700'},
  sub:{fontSize:F.sm,color:'rgba(255,255,255,0.7)',marginTop:4},
  label:{fontSize:F.xs,fontWeight:'700',color:C.textMuted,letterSpacing:1,marginBottom:S.sm,marginTop:S.lg},
  input:{backgroundColor:C.white,borderWidth:1.5,borderColor:C.border,borderRadius:R.md,padding:S.md,fontSize:F.base,color:C.textPrimary,...Sh.sm},
  sevBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:S.sm,borderWidth:2,borderColor:C.border,borderRadius:R.md,paddingVertical:S.md,backgroundColor:C.white},
  tipoBtn:{borderWidth:1.5,borderColor:C.border,borderRadius:R.md,paddingHorizontal:S.md,paddingVertical:S.sm,backgroundColor:C.white},
  tipoBtnActive:{borderColor:C.black,backgroundColor:C.black},
  tipoText:{fontSize:F.sm,color:C.textSecondary},
  footer:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.border,padding:S.lg},
  btnSubmit:{backgroundColor:C.dangerMed,borderRadius:R.full,padding:S.lg,alignItems:'center'},
  btnSubmitText:{fontSize:F.base,fontWeight:'700',color:'#fff'},
});

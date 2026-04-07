import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addChecklist, RootState } from '../store';
import { checklistApi } from '../services/api';
import { C, S, R, F, Sh } from '../theme';

const TEMPLATES = [
  { id:'nr18', norma:'NR-18', titulo:'Verificação de EPI — Obra', desc:'Equipamentos de proteção individual', itens:[
    {id:'i1',label:'Capacete com jugular em bom estado',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i2',label:'Cinto de segurança tipo paraquedista',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i3',label:'Óculos de proteção adequados à atividade',obrigatorio:false,tipo:'checkbox',checked:false},
    {id:'i4',label:'Luvas adequadas para a atividade realizada',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i5',label:'Protetor auricular quando necessário',obrigatorio:false,tipo:'checkbox',checked:false},
    {id:'i6',label:'Calçado de segurança com biqueira de aço',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i7',label:'Colete refletivo em áreas com tráfego',obrigatorio:false,tipo:'checkbox',checked:false},
    {id:'i8',label:'Protetor solar aplicado nos trabalhadores',obrigatorio:false,tipo:'checkbox',checked:false},
    {id:'i9',label:'Foto do colaborador com todos os EPIs',obrigatorio:false,tipo:'foto',checked:false},
  ]},
  { id:'nr35', norma:'NR-35', titulo:'Trabalho em Altura — Pré-Atividade', desc:'Segurança em trabalho acima de 2 metros', itens:[
    {id:'i1',label:'Andaime inspecionado e liberado por responsável',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i2',label:'Cinto paraquedista com talabarte duplo',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i3',label:'Ponto de ancoragem identificado e testado',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i4',label:'Área abaixo sinalizada e isolada',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i5',label:'Trabalhador com certificado NR-35 válido',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i6',label:'Condições climáticas adequadas (sem chuva/vento)',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i7',label:'Comunicação com encarregado estabelecida',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i8',label:'Linha de vida instalada corretamente',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i9',label:'Foto do local com equipamentos instalados',obrigatorio:true,tipo:'foto',checked:false},
  ]},
  { id:'nr6', norma:'NR-6', titulo:'Inspeção Semanal de EPI — Almoxarifado', desc:'Controle semanal do estoque de EPIs', itens:[
    {id:'i1',label:'Estoque mínimo de capacetes disponível',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i2',label:'EPIs dentro do prazo de validade (CA ativo)',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i3',label:'Cintos de segurança sem avarias visíveis',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i4',label:'Registro de entrega de EPI atualizado',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i5',label:'Óculos e protetores auriculares em estoque',obrigatorio:false,tipo:'checkbox',checked:false},
    {id:'i6',label:'Descarte correto de EPIs com prazo vencido',obrigatorio:false,tipo:'checkbox',checked:false},
    {id:'i7',label:'Foto do almoxarifado organizado',obrigatorio:false,tipo:'foto',checked:false},
  ]},
  { id:'nr12', norma:'NR-12', titulo:'Inspeção de Máquinas e Equipamentos', desc:'Segurança em máquinas e equipamentos da obra', itens:[
    {id:'i1',label:'Proteções de partes móveis instaladas e fixas',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i2',label:'Dispositivo de parada de emergência funcional',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i3',label:'Aterramento elétrico verificado e documentado',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i4',label:'Operador habilitado e com treinamento válido',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i5',label:'Manual de operação acessível no local',obrigatorio:false,tipo:'checkbox',checked:false},
    {id:'i6',label:'Sinalização de segurança afixada corretamente',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i7',label:'Manutenção preventiva em dia (laudo vigente)',obrigatorio:true,tipo:'checkbox',checked:false},
    {id:'i8',label:'Área de trabalho limpa e organizada',obrigatorio:false,tipo:'checkbox',checked:false},
    {id:'i9',label:'Foto da máquina com proteções instaladas',obrigatorio:false,tipo:'foto',checked:false},
  ]},
];

export default function NewChecklistScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<typeof TEMPLATES[0]|null>(null);
  const [obra, setObra] = useState(user?.obra ?? '');
  const [resp, setResp] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!selected) return;
    if (!obra.trim()) { Alert.alert('Obrigatório', 'Informe o nome da obra.'); return; }
    setLoading(true);
    const payload = {
      id: Date.now().toString(),
      titulo: selected.titulo, norma: selected.norma,
      obra: obra.trim(), responsavel: resp.trim() || (user?.name ?? ''),
      status: 'pendente' as const, progresso: 0,
      itens: selected.itens.map(i => ({...i})),
      dataCriacao: new Date().toISOString(), syncPendente: false,
    };
    try {
      const res = await checklistApi.criar(payload);
      const finalId = res.data.id ?? payload.id;
      dispatch(addChecklist({ ...payload, id: finalId, syncPendente: false }));
      navigation.goBack();
      setTimeout(() => navigation.navigate('ChecklistDetail', { id: finalId }), 100);
    } catch {
      dispatch(addChecklist(payload));
      navigation.goBack();
      setTimeout(() => navigation.navigate('ChecklistDetail', { id: payload.id }), 100);
    } finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(0) : navigation.goBack()}>
          <Text style={s.back}>{step > 0 ? '← Voltar' : '✕ Fechar'}</Text>
        </TouchableOpacity>
        <Text style={s.title}>Nova Inspeção</Text>
        <View style={s.stepsRow}>
          {[0,1].map(i => <View key={i} style={[s.stepDot, step >= i && s.stepDotActive]} />)}
        </View>
        <Text style={s.stepLabel}>Passo {step+1} de 2: {step===0?'Escolher template':'Dados da obra'}</Text>
      </View>

      <ScrollView contentContainerStyle={{padding:S.lg,paddingBottom:120}} showsVerticalScrollIndicator={false}>
        {step === 0 && TEMPLATES.map(t => (
          <TouchableOpacity key={t.id} style={s.templateCard} onPress={() => { setSelected(t); setStep(1); }} activeOpacity={0.8}>
            <View style={s.templateTop}>
              <View style={s.normaBadge}><Text style={s.normaBadgeText}>{t.norma}</Text></View>
              <Text style={s.templateCount}>{t.itens.length} itens</Text>
            </View>
            <Text style={s.templateTitle}>{t.titulo}</Text>
            <Text style={s.templateDesc}>{t.desc}</Text>
            <View style={{flexDirection:'row',gap:S.lg,marginTop:S.sm}}>
              <Text style={s.templateInfo}>⚠️ {t.itens.filter(i=>i.obrigatorio).length} obrigatórios</Text>
              <Text style={s.templateInfo}>📷 {t.itens.filter(i=>i.tipo==='foto').length} com foto</Text>
            </View>
          </TouchableOpacity>
        ))}

        {step === 1 && selected && (
          <>
            <View style={s.selectedBox}>
              <View style={s.normaBadge}><Text style={s.normaBadgeText}>{selected.norma}</Text></View>
              <Text style={[s.templateTitle,{color:'#fff',marginTop:S.sm}]}>{selected.titulo}</Text>
              <Text style={{color:'rgba(255,255,255,0.6)',fontSize:F.sm,marginTop:4}}>{selected.itens.length} itens de inspeção</Text>
            </View>

            <Text style={s.label}>NOME DA OBRA *</Text>
            <TextInput style={s.input} value={obra} onChangeText={setObra} placeholder="Ex: Edifício Comercial Santos" placeholderTextColor={C.textMuted} />

            <Text style={s.label}>RESPONSÁVEL</Text>
            <TextInput style={s.input} value={resp} onChangeText={setResp} placeholder={user?.name ?? 'Nome do inspetor'} placeholderTextColor={C.textMuted} />

            <Text style={s.label}>PRÉVIA DOS ITENS</Text>
            {selected.itens.map(item => (
              <View key={item.id} style={s.previewItem}>
                <View style={[s.previewDot,{backgroundColor:item.obrigatorio?C.danger:C.textDisabled}]} />
                <Text style={s.previewText} numberOfLines={1}>{item.label}</Text>
                {item.tipo==='foto' && <Text style={{fontSize:12}}>📷</Text>}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {step === 1 && (
        <View style={s.footer}>
          <TouchableOpacity style={s.btnCreate} onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color={C.black} /> : <Text style={s.btnCreateText}>✅ Criar e Iniciar Inspeção</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.offWhite},
  header:{backgroundColor:C.black,paddingTop:52,paddingHorizontal:S.xl,paddingBottom:S.lg},
  back:{color:C.yellow,fontSize:F.sm,marginBottom:S.md},
  title:{fontSize:F.xxl,color:'#fff',fontWeight:'700'},
  stepsRow:{flexDirection:'row',gap:S.sm,marginTop:S.md},
  stepDot:{width:40,height:4,borderRadius:2,backgroundColor:'rgba(255,255,255,0.2)'},
  stepDotActive:{backgroundColor:C.yellow},
  stepLabel:{fontSize:F.xs,color:'rgba(255,255,255,0.6)',marginTop:S.sm},
  templateCard:{backgroundColor:C.white,borderRadius:R.lg,padding:S.lg,marginBottom:S.md,borderWidth:2,borderColor:C.border,...Sh.sm},
  templateTop:{flexDirection:'row',justifyContent:'space-between',marginBottom:S.sm},
  normaBadge:{backgroundColor:C.black,borderRadius:R.full,paddingHorizontal:S.md,paddingVertical:3,alignSelf:'flex-start'},
  normaBadgeText:{fontSize:F.xs,color:C.yellow,fontWeight:'700'},
  templateCount:{fontSize:F.xs,color:C.textMuted},
  templateTitle:{fontSize:F.base,fontWeight:'700',color:C.textPrimary,marginBottom:4},
  templateDesc:{fontSize:F.sm,color:C.textSecondary},
  templateInfo:{fontSize:F.xs,color:C.textMuted},
  selectedBox:{backgroundColor:C.black,borderRadius:R.lg,padding:S.xl,marginBottom:S.xl},
  label:{fontSize:F.xs,fontWeight:'700',color:C.textMuted,letterSpacing:1,marginBottom:S.sm,marginTop:S.lg},
  input:{backgroundColor:C.white,borderWidth:1.5,borderColor:C.border,borderRadius:R.md,padding:S.md,fontSize:F.base,color:C.textPrimary,...Sh.sm},
  previewItem:{flexDirection:'row',alignItems:'center',gap:S.sm,paddingVertical:5},
  previewDot:{width:6,height:6,borderRadius:3},
  previewText:{flex:1,fontSize:F.sm,color:C.textSecondary},
  footer:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.border,padding:S.lg},
  btnCreate:{backgroundColor:C.yellow,borderRadius:R.full,padding:S.lg,alignItems:'center'},
  btnCreateText:{fontSize:F.base,fontWeight:'700',color:C.black},
});

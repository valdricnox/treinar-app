import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, F, R, S } from '../theme';

type Status = 'concluido' | 'em_andamento' | 'pendente' | 'aberto' | 'resolvido';
type Severidade = 'critico' | 'alto' | 'medio' | 'baixo';

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  concluido:    { label: 'Concluído',    bg: C.successBg, text: C.successDark, dot: C.success },
  em_andamento: { label: 'Em Andamento', bg: C.warningBg, text: C.warningDark, dot: C.warning },
  pendente:     { label: 'Pendente',     bg: C.infoBg,    text: C.infoDark,    dot: C.info },
  aberto:       { label: 'Aberto',       bg: C.dangerBg,  text: C.dangerDark,  dot: C.danger },
  resolvido:    { label: 'Resolvido',    bg: C.successBg, text: C.successDark, dot: C.success },
};

const SEV_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  critico: { label: 'Crítico', bg: C.dangerBg,  text: C.dangerDark,  dot: C.danger },
  alto:    { label: 'Alto',    bg: C.warningBg, text: C.warningDark, dot: C.warning },
  medio:   { label: 'Médio',   bg: C.infoBg,    text: C.infoDark,    dot: C.info },
  baixo:   { label: 'Baixo',   bg: C.successBg, text: C.successDark, dot: C.success },
};

interface Props {
  type?: 'status' | 'severidade';
  value: string;
  showDot?: boolean;
}

export default function StatusBadge({ type = 'status', value, showDot = true }: Props) {
  const map = type === 'status' ? STATUS_MAP : SEV_MAP;
  const config = map[value] || map['pendente'];

  return (
    <View style={[s.badge, { backgroundColor: config.bg }]}>
      {showDot && <View style={[s.dot, { backgroundColor: config.dot }]} />}
      <Text style={[s.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    borderRadius: R.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: F.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

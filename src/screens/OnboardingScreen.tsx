import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline, G } from 'react-native-svg';
import { useDispatch } from 'react-redux';
import { setOnboardingComplete } from '../store';
import { C, S, R, F } from '../theme';

const { width: SW, height: SH } = Dimensions.get('window');

// SVG illustrations for each slide
function IllustrationInspection() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200" fill="none">
      <Rect x="40" y="20" width="120" height="160" rx="12" fill="#1C1C1E" />
      <Rect x="52" y="36" width="96" height="12" rx="4" fill="#F5C800" opacity="0.9" />
      <Rect x="52" y="56" width="80" height="8" rx="4" fill="#3A3A3C" />
      <Rect x="52" y="72" width="96" height="8" rx="4" fill="#3A3A3C" />
      <Rect x="52" y="88" width="64" height="8" rx="4" fill="#3A3A3C" />
      <Rect x="52" y="112" width="96" height="8" rx="4" fill="#3A3A3C" />
      <Rect x="52" y="128" width="80" height="8" rx="4" fill="#3A3A3C" />
      <Circle cx="140" cy="150" r="28" fill="#30D158" />
      <Polyline points="128 150 137 159 154 142" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function IllustrationIncident() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200" fill="none">
      <Circle cx="100" cy="100" r="72" fill="#2C2C2E" />
      <Path d="M100 48L152 138H48L100 48Z" fill="#FF3B30" opacity="0.15" />
      <Path d="M100 48L152 138H48L100 48Z" stroke="#FF3B30" strokeWidth="3" strokeLinejoin="round" fill="none" />
      <Line x1="100" y1="82" x2="100" y2="112" stroke="#FF3B30" strokeWidth="4" strokeLinecap="round" />
      <Circle cx="100" cy="124" r="3" fill="#FF3B30" />
      <Circle cx="58" cy="60" r="6" fill="#F5C800" opacity="0.6" />
      <Circle cx="142" cy="148" r="4" fill="#0A84FF" opacity="0.6" />
      <Circle cx="32" cy="120" r="5" fill="#30D158" opacity="0.5" />
    </Svg>
  );
}

function IllustrationReport() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200" fill="none">
      <Rect x="30" y="24" width="100" height="130" rx="10" fill="#1C1C1E" />
      <Rect x="30" y="24" width="100" height="130" rx="10" stroke="#3A3A3C" strokeWidth="1.5" fill="none" />
      <Rect x="42" y="40" width="76" height="10" rx="4" fill="#F5C800" opacity="0.8" />
      <Rect x="42" y="58" width="60" height="6" rx="3" fill="#3A3A3C" />
      <Rect x="42" y="72" width="76" height="6" rx="3" fill="#3A3A3C" />
      <Rect x="42" y="86" width="50" height="6" rx="3" fill="#3A3A3C" />
      <Rect x="42" y="104" width="76" height="24" rx="6" fill="#30D158" opacity="0.2" />
      <Line x1="42" y1="116" x2="62" y2="116" stroke="#30D158" strokeWidth="3" strokeLinecap="round" />
      <Line x1="42" y1="116" x2="118" y2="116" stroke="#3A3A3C" strokeWidth="2" strokeLinecap="round" />
      <Rect x="112" y="80" width="60" height="80" rx="10" fill="#2C2C2E" />
      <Rect x="112" y="80" width="60" height="80" rx="10" stroke="#3A3A3C" strokeWidth="1.5" fill="none" />
      <Path d="M132 110 L142 95 L152 108 L158 100 L172 115" stroke="#0A84FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx="162" cy="152" r="18" fill="#F5C800" />
      <Path d="M154 152 L160 158 L170 146" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

const SLIDES = [
  {
    title: 'Vistorias completas',
    subtitle: 'Realize inspeções de segurança com checklists das 15 NRs, fotos por item e GPS — tudo no celular.',
    illustration: <IllustrationInspection />,
    color: C.primary,
    bg: '#111111',
  },
  {
    title: 'Registre incidentes',
    subtitle: 'Registre ocorrências em campo com nível de severidade, fotos e localização. Notifique a equipe em tempo real.',
    illustration: <IllustrationIncident />,
    color: C.danger,
    bg: '#1A0A0A',
  },
  {
    title: 'Relatórios profissionais',
    subtitle: 'Gere PDFs completos com assinaturas digitais, fotos e indicadores de conformidade com um toque.',
    illustration: <IllustrationReport />,
    color: C.info,
    bg: '#0A0A1A',
  },
];

export default function OnboardingScreen() {
  const dispatch = useDispatch();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (idx: number) => {
    setCurrent(idx);
    scrollRef.current?.scrollTo({ x: idx * SW, animated: true });
  };

  const next = () => {
    if (current < SLIDES.length - 1) goTo(current + 1);
    else dispatch(setOnboardingComplete());
  };

  const slide = SLIDES[current];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: slide.bg }]}>
      {/* Skip */}
      <TouchableOpacity style={s.skip} onPress={() => dispatch(setOnboardingComplete())}>
        <Text style={s.skipTxt}>Pular</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={s.slide}>
            <View style={s.illustrationBox}>
              {slide.illustration}
            </View>
            <View style={s.textBox}>
              <Text style={[s.title, { color: slide.color }]}>{slide.title}</Text>
              <Text style={s.subtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots + Button */}
      <View style={s.bottom}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[s.dot, i === current && [s.dotActive, { backgroundColor: slide.color }]]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[s.btn, { backgroundColor: slide.color }]} onPress={next}>
          <Text style={[s.btnTxt, current === 2 && { color: C.white }]}>
            {current < SLIDES.length - 1 ? 'Próximo' : 'Começar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  skip: { alignSelf: 'flex-end', padding: S.md },
  skipTxt: { fontSize: F.sm, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  slide: { width: SW, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.xl },
  illustrationBox: { marginBottom: S.xxl },
  textBox: { alignItems: 'center', gap: S.sm },
  title: { fontSize: F.xxxl, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: F.md, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 26, maxWidth: 300 },
  bottom: { paddingHorizontal: S.xl, paddingBottom: S.xxl, gap: S.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: S.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 24, height: 8, borderRadius: 4 },
  btn: { borderRadius: R.xl, paddingVertical: S.md + 2, alignItems: 'center' },
  btnTxt: { fontWeight: '800', fontSize: F.md, color: C.black },
});

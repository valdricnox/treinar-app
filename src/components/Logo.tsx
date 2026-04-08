import React from 'react';
import { Image, View } from 'react-native';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: any;
}

const SIZES = {
  xs: { w: 60,  h: 60  },
  sm: { w: 90,  h: 90  },
  md: { w: 120, h: 120 },
  lg: { w: 160, h: 160 },
  xl: { w: 200, h: 200 },
};

// Logo local — sempre disponível, sem depender de internet
const LOCAL_LOGO = require('../../assets/treinar_logo.png');

export default function Logo({ size = 'md', style }: LogoProps) {
  const dim = SIZES[size];
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Image
        source={LOCAL_LOGO}
        style={{ width: dim.w, height: dim.h, resizeMode: 'contain' }}
      />
    </View>
  );
}

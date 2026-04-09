import React from 'react';
import Svg, {
  Path, Circle, Rect, Line, Polyline, Polygon,
  G, Ellipse,
} from 'react-native-svg';

interface IconProps {
  color?: string;
  size?: number;
  strokeWidth?: number;
}

const D = ({ color = '#8E8E93', size = 20, sw = 1.8, children }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {React.Children.map(children, (child) =>
      React.cloneElement(child, {
        stroke: child.props.stroke || color,
        strokeWidth: child.props.strokeWidth || sw,
        strokeLinecap: child.props.strokeLinecap || 'round',
        strokeLinejoin: child.props.strokeLinejoin || 'round',
        fill: child.props.fill || 'none',
      })
    )}
  </Svg>
);

// Navigation
export const IcDashboard = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="13" width="4" height="8" rx="1" fill={color} />
    <Rect x="10" y="8" width="4" height="13" rx="1" fill={color} />
    <Rect x="17" y="3" width="4" height="18" rx="1" fill={color} />
  </Svg>
);

export const IcChecklists = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Rect x="4" y="2" width="16" height="20" rx="2" />
    <Line x1="8" y1="8" x2="16" y2="8" />
    <Line x1="8" y1="12" x2="16" y2="12" />
    <Line x1="8" y1="16" x2="13" y2="16" />
  </D>
);

export const IcIncidents = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M12 3L21.5 20H2.5L12 3Z" strokeLinejoin="round" />
    <Line x1="12" y1="10" x2="12" y2="14" />
    <Circle cx="12" cy="17.5" r="0.8" fill={color} stroke="none" />
  </D>
);

export const IcReports = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Rect x="4" y="2" width="13" height="17" rx="2" />
    <Path d="M9 21v-3l3 1.5 3-1.5v3" />
    <Line x1="7" y1="8" x2="13" y2="8" />
    <Line x1="7" y1="12" x2="13" y2="12" />
  </D>
);

export const IcTeam = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Circle cx="9" cy="7" r="3" />
    <Path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6" />
    <Circle cx="18" cy="8" r="2" />
    <Path d="M22 20c0-2.21-1.79-4-4-4" />
  </D>
);

export const IcUser = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
  </D>
);

export const IcAdmin = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </D>
);

// Actions
export const IcPlus = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </D>
);

export const IcSearch = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </D>
);

export const IcCamera = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <Circle cx="12" cy="13" r="4" />
  </D>
);

export const IcGallery = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Rect x="3" y="3" width="18" height="18" rx="2" />
    <Circle cx="8.5" cy="8.5" r="1.5" />
    <Polyline points="21 15 16 10 5 21" />
  </D>
);

export const IcSave = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <Polyline points="17 21 17 13 7 13 7 21" />
    <Polyline points="7 3 7 8 15 8" />
  </D>
);

export const IcTrash = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </D>
);

export const IcArchive = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Polyline points="21 8 21 21 3 21 3 8" />
    <Rect x="1" y="3" width="22" height="5" />
    <Line x1="10" y1="12" x2="14" y2="12" />
  </D>
);

export const IcEdit = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </D>
);

export const IcKey = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </D>
);

export const IcLocation = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
    <Circle cx="12" cy="10" r="3" />
  </D>
);

export const IcLogout = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </D>
);

export const IcCheck = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Polyline points="20 6 9 17 4 12" />
  </D>
);

export const IcX = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </D>
);

export const IcChevronRight = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Polyline points="9 18 15 12 9 6" />
  </D>
);

export const IcChevronLeft = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Polyline points="15 18 9 12 15 6" />
  </D>
);

export const IcChevronDown = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Polyline points="6 9 12 15 18 9" />
  </D>
);

export const IcMore = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Circle cx="12" cy="12" r="1" fill={color} stroke="none" />
    <Circle cx="19" cy="12" r="1" fill={color} stroke="none" />
    <Circle cx="5" cy="12" r="1" fill={color} stroke="none" />
  </D>
);

export const IcShield = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" />
  </D>
);

export const IcPDF = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="16" y1="13" x2="8" y2="13" />
    <Line x1="16" y1="17" x2="8" y2="17" />
    <Polyline points="10 9 9 9 8 9" />
  </D>
);

export const IcShare = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Circle cx="18" cy="5" r="3" />
    <Circle cx="6" cy="12" r="3" />
    <Circle cx="18" cy="19" r="3" />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </D>
);

export const IcSign = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </D>
);

export const IcWarning = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M12 3L21.5 20H2.5L12 3Z" strokeLinejoin="round" />
    <Line x1="12" y1="10" x2="12" y2="14" />
    <Circle cx="12" cy="17" r="0.5" fill={color} stroke="none" />
  </D>
);

export const IcPin = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
    <Circle cx="12" cy="10" r="3" />
  </D>
);

export const IcPerson = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Circle cx="12" cy="7" r="4" />
    <Path d="M5.5 20a7 7 0 0113 0" />
  </D>
);

export const IcBadge = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Rect x="2" y="7" width="20" height="14" rx="2" />
    <Path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    <Line x1="12" y1="12" x2="12" y2="16" />
    <Line x1="10" y1="14" x2="14" y2="14" />
  </D>
);

export const IcActivity = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </D>
);

export const IcRefresh = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Polyline points="23 4 23 10 17 10" />
    <Polyline points="1 20 1 14 7 14" />
    <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </D>
);

export const IcBuilding = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Rect x="2" y="3" width="20" height="18" rx="1" />
    <Path d="M8 21V3M16 21V3M2 9h6M16 9h6M2 15h6M16 15h6" />
  </D>
);

export const IcMail = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Polyline points="22 6 12 13 2 6" />
  </D>
);

export const IcClock = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </D>
);

export const IcInfo = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </D>
);

export const IcInbox = ({ color = '#8E8E93', size = 20 }: IconProps) => (
  <D color={color} size={size}>
    <Polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <Path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
  </D>
);

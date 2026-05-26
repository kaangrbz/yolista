import { Platform } from 'react-native';

/** Tek kart — tüm modlarda aynı. */
export const MAP_MARKER_CARD_SIZE = 46;

/**
 * Marker konteyneri — 1/2/3/4/5+ stack modunda boyut ASLA değişmez.
 * Snapshot genişliği / yüksekliği sabit kalmalı (anchor drift önlemi).
 */
export const MAP_MARKER_WIDTH = 76;
export const MAP_MARKER_HEIGHT = 74;

export const MAP_MARKER_TAIL_WIDTH = 10;
export const MAP_MARKER_TAIL_HEIGHT = 6;
/** Ok ucu kart tabanına bindirilir. */
export const MAP_MARKER_TAIL_OVERLAP = 3;

/** Kart yığını alanı — konteyner ile aynı boyut (moddan bağımsız). */
export const MAP_MARKER_STACK_WIDTH = MAP_MARKER_WIDTH;
export const MAP_MARKER_STACK_HEIGHT = MAP_MARKER_HEIGHT;

/** Kartların stack içindeki taban hizası (ok ile birleşik). */
export const MAP_MARKER_CARD_BASE_LEFT =
  (MAP_MARKER_STACK_WIDTH - MAP_MARKER_CARD_SIZE) / 2;
export const MAP_MARKER_CARD_BASE_BOTTOM =
  MAP_MARKER_TAIL_HEIGHT - MAP_MARKER_TAIL_OVERLAP;

/** Koordinat = konteyner alt orta (ok ucu). */
export const MAP_MARKER_ANCHOR = { x: 0.5, y: 1 } as const;

export interface MapMarkerCardSlot {
  translateX: number;
  rotate: string;
  zIndex: number;
  opacity: number;
}

/** Iskambil fan — transform sadece translateX + rotate (scale yok). */
const STACK_SLOTS: MapMarkerCardSlot[][] = [
  [{ translateX: 0, rotate: '0deg', zIndex: 1, opacity: 1 }],
  [
    { translateX: -6, rotate: '-12deg', zIndex: 1, opacity: 0.88 },
    { translateX: 6, rotate: '8deg', zIndex: 2, opacity: 1 },
  ],
  [
    { translateX: -10, rotate: '-16deg', zIndex: 1, opacity: 0.82 },
    { translateX: 0, rotate: '0deg', zIndex: 2, opacity: 0.92 },
    { translateX: 10, rotate: '14deg', zIndex: 3, opacity: 1 },
  ],
  [
    { translateX: -12, rotate: '-18deg', zIndex: 1, opacity: 0.78 },
    { translateX: -4, rotate: '-7deg', zIndex: 2, opacity: 0.86 },
    { translateX: 4, rotate: '7deg', zIndex: 3, opacity: 0.94 },
    { translateX: 12, rotate: '16deg', zIndex: 4, opacity: 1 },
  ],
  [
    { translateX: -14, rotate: '-20deg', zIndex: 1, opacity: 0.75 },
    { translateX: -7, rotate: '-10deg', zIndex: 2, opacity: 0.84 },
    { translateX: 0, rotate: '0deg', zIndex: 3, opacity: 0.92 },
    { translateX: 7, rotate: '10deg', zIndex: 4, opacity: 0.96 },
    { translateX: 14, rotate: '18deg', zIndex: 5, opacity: 1 },
  ],
];

export const getMapMarkerStackSlots = (count: number): MapMarkerCardSlot[] => {
  const safeCount = Math.min(Math.max(count, 1), 5);
  return STACK_SLOTS[safeCount - 1];
};

export const getMapMarkerVisibleCount = (count: number): number => {
  return Math.min(Math.max(count, 1), 5);
};

export const getMapMarkerBadgeLabel = (count: number): string | null => {
  if (count <= 1) {
    return null;
  }

  if (count > 5) {
    return '5+';
  }

  return String(count);
};

const getCenterOffsetForAnchor = (): { x: number; y: number } => ({
  x: MAP_MARKER_WIDTH * 0.5 - MAP_MARKER_WIDTH * MAP_MARKER_ANCHOR.x,
  y: MAP_MARKER_HEIGHT * 0.5 - MAP_MARKER_HEIGHT * MAP_MARKER_ANCHOR.y,
});

export const getMapMarkerAnchorProps = (): {
  anchor: { x: number; y: number };
  centerOffset?: { x: number; y: number };
} => {
  if (Platform.OS === 'ios') {
    return {
      anchor: MAP_MARKER_ANCHOR,
      centerOffset: getCenterOffsetForAnchor(),
    };
  }

  return { anchor: MAP_MARKER_ANCHOR };
};

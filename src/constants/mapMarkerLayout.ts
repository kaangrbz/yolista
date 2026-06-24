import { Platform } from 'react-native';

/** Tek kart — tüm modlarda aynı. */
export const MAP_MARKER_CARD_SIZE = 46;

/** Görsel destede en fazla render edilen kart sayısı. */
export const MAP_MARKER_MAX_VISIBLE = 3;

/**
 * Marker konteyneri — 1/2/3+ stack modunda boyut ASLA değişmez.
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

const MAX_SPREAD = 10;
const MAX_ANGLE = 16;

/**
 * Iskambil fan — transform sadece translateX + rotate (scale yok).
 * En ön kart (son indeks) her zaman merkezde düz; arkadakiler yelpaze.
 * Parite visibleCount üzerinden uygulanır.
 */
export const getMapMarkerStackSlots = (count: number): MapMarkerCardSlot[] => {
  const visibleCount = Math.min(Math.max(count, 1), MAP_MARKER_MAX_VISIBLE);
  const isEven = visibleCount % 2 === 0;
  const backCount = visibleCount - 1;
  const slots: MapMarkerCardSlot[] = [];

  for (let index = 0; index < visibleCount; index += 1) {
    const isFront = index === visibleCount - 1;
    const zIndex = index + 1;
    const soften =
      backCount === 0 ? 1 : (index + 1) / visibleCount;
    const opacity = isFront ? 1 : 0.68 + soften * 0.22;

    if (isFront) {
      slots.push({ translateX: 0, rotate: '0deg', zIndex, opacity: 1 });
      continue;
    }

    if (isEven) {
      if (backCount === 1) {
        slots.push({
          translateX: -MAX_SPREAD,
          rotate: `-${MAX_ANGLE}deg`,
          zIndex,
          opacity,
        });
        continue;
      }

      const half = backCount / 2;
      const isLeft = index < half;
      const sideIndex = isLeft ? index : index - half;
      const sign = isLeft ? -1 : 1;
      const t = (sideIndex + 1) / half;
      slots.push({
        translateX: sign * MAX_SPREAD * t,
        rotate: `${sign * MAX_ANGLE * t}deg`,
        zIndex,
        opacity,
      });
      continue;
    }

    const leftCount = Math.floor(backCount / 2);
    const rightCount = backCount - leftCount;

    if (index < leftCount) {
      const t = leftCount === 0 ? 1 : (index + 1) / leftCount;
      slots.push({
        translateX: -MAX_SPREAD * t,
        rotate: `${-MAX_ANGLE * t}deg`,
        zIndex,
        opacity,
      });
      continue;
    }

    const rightIndex = index - leftCount;
    const t = rightCount === 0 ? 0 : (rightCount - rightIndex) / rightCount;
    const softenFactor = 0.65 + t * 0.35;
    slots.push({
      translateX: MAX_SPREAD * softenFactor,
      rotate: `${MAX_ANGLE * softenFactor}deg`,
      zIndex,
      opacity,
    });
  }

  return slots;
};

export const getMapMarkerVisibleCount = (count: number): number => {
  return Math.min(Math.max(count, 1), MAP_MARKER_MAX_VISIBLE);
};

export const getMapMarkerBadgeLabel = (count: number): string | null => {
  if (count <= 1) {
    return null;
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

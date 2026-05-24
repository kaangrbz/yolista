import { Dimensions } from 'react-native';
import type { RouteImageAlignment, RouteWithProfile } from '../model/routes.model';

export type ExploreLayoutMode = 'grid' | 'masonry';

/**
 * Keşfet feed düzeni — kullanıcı arayüzünde seçilmez.
 * Pinterest tarzı için 'masonry', klasik 3 sütun için 'grid'.
 */
export const EXPLORE_LAYOUT_MODE: ExploreLayoutMode = 'masonry';

export const EXPLORE_GRID_COLUMNS = 3;
export const EXPLORE_MASONRY_COLUMNS = 3;

const HORIZONTAL_PADDING = 4;
const COLUMN_GAP = 4;
const ROW_GAP = 4;

const PORTRAIT_HEIGHT_RATIO = 1.45;
const LANDSCAPE_HEIGHT_RATIO = 0.72;

export function getExploreGridCardWidth(screenWidth: number = Dimensions.get('window').width): number {
  return screenWidth / EXPLORE_GRID_COLUMNS;
}

export function getExploreMasonryColumnWidth(screenWidth: number = Dimensions.get('window').width): number {
  const totalGutter = HORIZONTAL_PADDING * 2 + COLUMN_GAP * (EXPLORE_MASONRY_COLUMNS - 1);

  return (screenWidth - totalGutter) / EXPLORE_MASONRY_COLUMNS;
}

export function getExploreTileHeight(
  alignment: RouteImageAlignment | null | undefined,
  columnWidth: number,
): number {
  if (alignment === 'portrait') {
    return Math.round(columnWidth * PORTRAIT_HEIGHT_RATIO);
  }

  if (alignment === 'landscape') {
    return Math.round(columnWidth * LANDSCAPE_HEIGHT_RATIO);
  }

  if (alignment === 'square') {
    return Math.round(columnWidth);
  }

  return Math.round(columnWidth);
}

export function getMasonryRowGap(): number {
  return ROW_GAP;
}

export function getMasonryColumnGap(): number {
  return COLUMN_GAP;
}

export function distributeToMasonryColumns<T>(
  items: T[],
  getItemHeight: (item: T) => number,
  columnCount: number = EXPLORE_MASONRY_COLUMNS,
): T[][] {
  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  const columnHeights = Array(columnCount).fill(0);

  for (const item of items) {
    const tileHeight = getItemHeight(item);
    let shortestColumnIndex = 0;

    for (let columnIndex = 1; columnIndex < columnCount; columnIndex += 1) {
      if (columnHeights[columnIndex] < columnHeights[shortestColumnIndex]) {
        shortestColumnIndex = columnIndex;
      }
    }

    columns[shortestColumnIndex].push(item);
    columnHeights[shortestColumnIndex] += tileHeight + ROW_GAP;
  }

  return columns;
}

export function getRouteMasonryHeight(route: RouteWithProfile, columnWidth: number): number {
  return getExploreTileHeight(route.image_alignment, columnWidth);
}

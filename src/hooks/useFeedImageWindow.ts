import { useCallback, useRef } from 'react';
import type { ViewToken } from 'react-native';
import type { RouteWithProfile } from '../model/routes.model';
import { feedImageDownloadLog } from '../services/feedImageDownloadDebug';
import { feedImageWindow } from '../services/FeedImageWindow';

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 100,
};

function pickFocusIndex(viewableItems: ViewToken[]): number {
  if (viewableItems.length === 0) {
    return feedImageWindow.getFocusIndex();
  }

  const indices = viewableItems
    .map((item) => item.index)
    .filter((index): index is number => index !== null && index !== undefined)
    .sort((left, right) => left - right);

  if (indices.length === 0) {
    return feedImageWindow.getFocusIndex();
  }

  return indices[Math.floor(indices.length / 2)];
}

export function useFeedImageWindow(routes: RouteWithProfile[]) {
  const routesRef = useRef(routes);
  routesRef.current = routes;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const focusIndex = pickFocusIndex(viewableItems);
      const items = routesRef.current.map((route, index) => ({
        id: route.id || '',
        index,
      }));

      feedImageDownloadLog('viewable items changed', {
        focusIndex,
        viewableIndices: viewableItems
          .map((item) => item.index)
          .filter((index): index is number => index !== null && index !== undefined),
      });

      feedImageWindow.invalidateOutsideWindow(items, focusIndex);
      feedImageWindow.setFocusIndex(focusIndex);
    },
    [],
  );

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: VIEWABILITY_CONFIG,
      onViewableItemsChanged,
    },
  ]).current;

  viewabilityConfigCallbackPairs[0].onViewableItemsChanged = onViewableItemsChanged;

  return {
    onViewableItemsChanged,
    viewabilityConfig: VIEWABILITY_CONFIG,
    viewabilityConfigCallbackPairs,
  };
}

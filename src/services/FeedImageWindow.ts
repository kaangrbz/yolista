import { feedImageDownloadLog } from './feedImageDownloadDebug';
import { feedImageDownloadQueue } from './FeedImageDownloadQueue';

const BEHIND = 1;
const AHEAD = 2;

type Listener = () => void;

type PostSnapshot = {
  enabled: boolean;
  generation: number;
};

type PostSubscription = {
  feedIndex: number;
  listener: Listener;
};

class FeedImageWindowManager {
  private focusIndex = 0;
  private generations = new Map<string, number>();
  private inWindowPosts = new Set<string>();
  private postListeners = new Map<string, Set<PostSubscription>>();
  private snapshotCache = new Map<string, PostSnapshot>();

  subscribePost(postId: string, feedIndex: number, listener: Listener): () => void {
    const subscription: PostSubscription = { feedIndex, listener };

    if (!this.postListeners.has(postId)) {
      this.postListeners.set(postId, new Set());
    }

    this.postListeners.get(postId)?.add(subscription);

    return () => {
      this.postListeners.get(postId)?.delete(subscription);
    };
  }

  getPostSnapshot(postId: string, feedIndex: number): PostSnapshot {
    const enabled = this.isInDownloadWindow(feedIndex);
    const generation = this.getGeneration(postId);
    const cacheKey = `${postId}:${feedIndex}`;
    const cached = this.snapshotCache.get(cacheKey);

    if (
      cached
      && cached.enabled === enabled
      && cached.generation === generation
    ) {
      return cached;
    }

    const snapshot = { enabled, generation };
    this.snapshotCache.set(cacheKey, snapshot);

    return snapshot;
  }

  private invalidateSnapshotCache(postId: string) {
    for (const key of this.snapshotCache.keys()) {
      if (key.startsWith(`${postId}:`)) {
        this.snapshotCache.delete(key);
      }
    }
  }

  private notifyPost(postId: string) {
    this.invalidateSnapshotCache(postId);
    this.postListeners.get(postId)?.forEach((subscription) => {
      subscription.listener();
    });
  }

  setFocusIndex(index: number) {
    const next = Math.max(0, index);

    if (next === this.focusIndex) {
      return;
    }

    const previous = this.focusIndex;
    this.focusIndex = next;
    feedImageDownloadLog('focus changed', { from: previous, to: next });
    feedImageDownloadQueue.reprioritize();
  }

  getFocusIndex(): number {
    return this.focusIndex;
  }

  isInDownloadWindow(index: number, focusIndex = this.focusIndex): boolean {
    return index >= focusIndex - BEHIND && index <= focusIndex + AHEAD;
  }

  getGeneration(itemId: string): number {
    return this.generations.get(itemId) ?? 0;
  }

  bumpGeneration(itemId: string, reason = 'manual bump') {
    const next = (this.generations.get(itemId) ?? 0) + 1;
    this.generations.set(itemId, next);
    feedImageDownloadLog('generation bumped', { postId: itemId, generation: next, reason });
    feedImageDownloadQueue.cancelForPost(itemId, reason);
    this.notifyPost(itemId);
  }

  invalidateOutsideWindow(
    items: Array<{ id: string; index: number }>,
    focusIndex = this.focusIndex,
  ) {
    const nextInWindow = new Set<string>();
    let changed = false;

    for (const item of items) {
      if (item.id && this.isInDownloadWindow(item.index, focusIndex)) {
        nextInWindow.add(item.id);
      }
    }

    for (const item of items) {
      if (!item.id) {
        continue;
      }

      const wasIn = this.inWindowPosts.has(item.id);
      const nowIn = nextInWindow.has(item.id);

      if (wasIn && !nowIn) {
        feedImageDownloadLog('left download window', {
          postId: item.id,
          postIndex: item.index,
          focusIndex,
        });
        feedImageDownloadQueue.cancelForPost(item.id, 'left download window');
        this.notifyPost(item.id);
        changed = true;
        continue;
      }

      if (!wasIn && nowIn) {
        feedImageDownloadLog('entered download window', {
          postId: item.id,
          postIndex: item.index,
          focusIndex,
        });
        this.notifyPost(item.id);
        changed = true;
      }
    }

    this.inWindowPosts = nextInWindow;

    if (changed) {
      feedImageDownloadLog('download window updated', { focusIndex });
    }
  }

  getPostPriority(postIndex: number, focusIndex = this.focusIndex): number {
    return Math.abs(postIndex - focusIndex);
  }
}

export const feedImageWindow = new FeedImageWindowManager();

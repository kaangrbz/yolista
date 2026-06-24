import { feedImageDownloadLog } from './feedImageDownloadDebug';
import { feedImageWindow } from './FeedImageWindow';

export class FeedImageDownloadCancelledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedImageDownloadCancelledError';
  }
}

type QueueEntry = {
  postId: string;
  postIndex: number;
  slideIndex: number;
  carouselIndex: number;
  generation: number;
  priority: number;
  resolve: () => void;
  reject: (error: FeedImageDownloadCancelledError) => void;
  cancelled: boolean;
  cancelReason?: string;
};

const MAX_CONCURRENT = 2;

class FeedImageDownloadQueueManager {
  private waiting: QueueEntry[] = [];
  private activeCount = 0;

  computePriority(
    postIndex: number,
    slideIndex: number,
    carouselIndex: number,
    focusIndex: number,
  ): number {
    const postDistance = Math.abs(postIndex - focusIndex);
    const slideOffset = Math.max(0, slideIndex - carouselIndex);

    return postDistance * 100 + slideOffset;
  }

  private sortWaiting() {
    const focusIndex = feedImageWindow.getFocusIndex();

    for (const entry of this.waiting) {
      entry.priority = this.computePriority(
        entry.postIndex,
        entry.slideIndex,
        entry.carouselIndex,
        focusIndex,
      );
    }

    this.waiting.sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      return left.postIndex - right.postIndex;
    });
  }

  reprioritize() {
    if (this.waiting.length === 0) {
      return;
    }

    this.sortWaiting();
    feedImageDownloadLog('queue reprioritized', {
      focusIndex: feedImageWindow.getFocusIndex(),
      waiting: this.waiting.map((entry) => ({
        postId: entry.postId,
        postIndex: entry.postIndex,
        slideIndex: entry.slideIndex,
        priority: entry.priority,
      })),
    });
    this.pump();
  }

  cancelForPost(postId: string, reason: string) {
    let cancelledCount = 0;

    for (const entry of this.waiting) {
      if (entry.postId !== postId || entry.cancelled) {
        continue;
      }

      entry.cancelled = true;
      entry.cancelReason = reason;
      entry.reject(new FeedImageDownloadCancelledError(reason));
      cancelledCount += 1;
    }

    if (cancelledCount > 0) {
      this.waiting = this.waiting.filter((entry) => !entry.cancelled);
      feedImageDownloadLog('cancelled queued downloads', {
        postId,
        reason,
        count: cancelledCount,
      });
    }
  }

  async acquire(options: {
    postId: string;
    postIndex: number;
    slideIndex: number;
    carouselIndex: number;
    generation: number;
    shouldContinue: () => boolean;
  }): Promise<void> {
    if (!options.shouldContinue()) {
      feedImageDownloadLog('acquire skipped (stale before enqueue)', {
        postId: options.postId,
        slideIndex: options.slideIndex,
        generation: options.generation,
      });
      throw new FeedImageDownloadCancelledError('stale before enqueue');
    }

    const focusIndex = feedImageWindow.getFocusIndex();
    const priority = this.computePriority(
      options.postIndex,
      options.slideIndex,
      options.carouselIndex,
      focusIndex,
    );

    feedImageDownloadLog('acquire enqueued', {
      postId: options.postId,
      postIndex: options.postIndex,
      slideIndex: options.slideIndex,
      carouselIndex: options.carouselIndex,
      generation: options.generation,
      focusIndex,
      priority,
      activeCount: this.activeCount,
      waitingCount: this.waiting.length,
    });

    await new Promise<void>((resolve, reject) => {
      const entry: QueueEntry = {
        postId: options.postId,
        postIndex: options.postIndex,
        slideIndex: options.slideIndex,
        carouselIndex: options.carouselIndex,
        generation: options.generation,
        priority,
        resolve,
        reject,
        cancelled: false,
      };

      this.waiting.push(entry);
      this.sortWaiting();
      this.pump();
    });
  }

  release(postId: string, slideIndex: number) {
    this.activeCount = Math.max(0, this.activeCount - 1);
    feedImageDownloadLog('release slot', {
      postId,
      slideIndex,
      activeCount: this.activeCount,
      waitingCount: this.waiting.length,
    });
    this.pump();
  }

  private pump() {
    while (this.activeCount < MAX_CONCURRENT && this.waiting.length > 0) {
      const next = this.waiting.shift();

      if (!next) {
        return;
      }

      if (next.cancelled) {
        continue;
      }

      if (feedImageWindow.getGeneration(next.postId) !== next.generation) {
        feedImageDownloadLog('dequeued stale job', {
          postId: next.postId,
          slideIndex: next.slideIndex,
          generation: next.generation,
          currentGeneration: feedImageWindow.getGeneration(next.postId),
        });
        next.reject(new FeedImageDownloadCancelledError('generation mismatch'));
        continue;
      }

      this.activeCount += 1;
      feedImageDownloadLog('acquire granted', {
        postId: next.postId,
        postIndex: next.postIndex,
        slideIndex: next.slideIndex,
        priority: next.priority,
        activeCount: this.activeCount,
      });
      next.resolve();
    }
  }
}

export const feedImageDownloadQueue = new FeedImageDownloadQueueManager();

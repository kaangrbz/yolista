import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import CommentsSheet from '../components/comments/CommentsSheet';

export type CommentsParentType = 'routeDetail' | 'homePage';

export interface OpenCommentsParams {
  routeId: string;
  routeOwnerId: string;
  parentType?: CommentsParentType;
}

type CommentCountListener = (count: number) => void;

interface CommentsSheetContextValue {
  openComments: (params: OpenCommentsParams) => void;
  closeComments: () => void;
  subscribeCommentCount: (
    routeId: string,
    listener: CommentCountListener,
  ) => () => void;
  notifyCommentCount: (routeId: string, count: number) => void;
}

interface ActiveCommentsState {
  routeId: string;
  routeOwnerId: string;
  parentType: CommentsParentType;
}

const CommentsSheetContext = createContext<CommentsSheetContextValue | undefined>(
  undefined,
);

export const useCommentsSheet = (): CommentsSheetContextValue => {
  const context = useContext(CommentsSheetContext);

  if (!context) {
    throw new Error('useCommentsSheet must be used within CommentsSheetProvider');
  }

  return context;
};

export const CommentsSheetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeComments, setActiveComments] = useState<ActiveCommentsState | null>(
    null,
  );
  const countListenersRef = useRef<Map<string, Set<CommentCountListener>>>(
    new Map(),
  );

  const openComments = useCallback((params: OpenCommentsParams) => {
    setActiveComments({
      routeId: params.routeId,
      routeOwnerId: params.routeOwnerId,
      parentType: params.parentType ?? 'homePage',
    });
  }, []);

  const closeComments = useCallback(() => {
    setActiveComments(null);
  }, []);

  const subscribeCommentCount = useCallback(
    (routeId: string, listener: CommentCountListener) => {
      const listeners = countListenersRef.current.get(routeId) ?? new Set();

      listeners.add(listener);
      countListenersRef.current.set(routeId, listeners);

      return () => {
        const current = countListenersRef.current.get(routeId);

        if (!current) {
          return;
        }

        current.delete(listener);

        if (current.size === 0) {
          countListenersRef.current.delete(routeId);
        }
      };
    },
    [],
  );

  const notifyCommentCount = useCallback((routeId: string, count: number) => {
    const listeners = countListenersRef.current.get(routeId);

    if (!listeners) {
      return;
    }

    listeners.forEach((listener) => {
      listener(count);
    });
  }, []);

  const value = useMemo(
    () => ({
      openComments,
      closeComments,
      subscribeCommentCount,
      notifyCommentCount,
    }),
    [openComments, closeComments, subscribeCommentCount, notifyCommentCount],
  );

  return (
    <CommentsSheetContext.Provider value={value}>
      {children}
      <CommentsSheet
        activeComments={activeComments}
        onClose={closeComments}
        onCommentCountChange={notifyCommentCount}
      />
    </CommentsSheetContext.Provider>
  );
};

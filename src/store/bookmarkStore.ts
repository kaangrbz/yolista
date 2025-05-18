import { create } from 'zustand';
import { Bookmark } from '../model/routes.model';

export interface BookmarkState {
  bookmarks: Bookmark[];
  addBookmark: (bookmark?: Partial<Bookmark>) => void;
  updateBookmark: (bookmarkId: string, field: string, value: string) => void;
  removeBookmark: (bookmarkId: string) => void;
  clearBookmarks: () => void;
}

export const useBookmarkStore = create<BookmarkState>((set) => ({
  bookmarks: [], // Initial state
  addBookmark: (bookmark = {}) => 
    set((state) => ({ 
      bookmarks: [...state.bookmarks, {
        title: '',
        description: '',
        ...bookmark
      } as Bookmark] 
    })),
  updateBookmark: (bookmarkId, field, value) =>
    set((state) => ({
      bookmarks: state.bookmarks.map(bookmark => 
        bookmark.id === bookmarkId ? { ...bookmark, [field]: value } : bookmark
      )
    })),
  removeBookmark: (bookmarkId) => 
    set((state) => ({ 
      bookmarks: state.bookmarks.filter(bookmark => bookmark.id !== bookmarkId) 
    })),
  clearBookmarks: () => set({ bookmarks: [] }),
}));

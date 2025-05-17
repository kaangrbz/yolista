import { create } from 'zustand';

export interface Bookmark {
  id: string;
  title: string;
  image?: string;
  imageUri?: string;
  description?: string | null;
  longitude?: number;
  latitude?: number;
}

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
        id: Math.random().toString(36).substring(2, 9),
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

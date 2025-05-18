import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface Bookmark {
  id: string;
  title: string;
  image?: string;
  imageUri?: string;
  description?: string | null;
  longitude?: number;
  latitude?: number;
}

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onRemoveBookmark?: (id: string) => void;
  onAddBookmark?: () => void;
  onUpdateBookmark?: (id: string, field: string, value: string) => void;
  onImageSelect?: (id: string) => void;
  error?: string;
  editable?: boolean;
}

const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  onRemoveBookmark,
  onAddBookmark,
  onUpdateBookmark,
  onImageSelect,
  error,
  editable = true
}) => {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (bookmarks.length > 0) {
      console.log('Bookmarks changed, length:', bookmarks.length);
      
      // Add a small delay to ensure the item is rendered
      setTimeout(() => {
        // Calculate the position to scroll to
        const itemHeight = 240; // Height of each bookmark item
        const scrollPosition = (bookmarks.length - 1) * itemHeight;
        
        // Scroll to the position
        flatListRef.current?.scrollTo({
          y: scrollPosition,
          animated: true
        });
      }, 100);
    }
  }, [bookmarks, flatListRef]);


  const MAX_BOOKMARKS = 10;
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Duraklar <Text style={{ color: 'red' }}>*</Text>
                            <Text style={{ color: '#666', fontSize: 12 }}> (En fazla 10 durak ekleyebilirsiniz)</Text>
                        </Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <ScrollView
        ref={flatListRef}
        contentContainerStyle={styles.listContainer}
      >
        {bookmarks.map((bookmark, index) => (
          <View key={bookmark?.id || index} style={styles.bookmarkItem}>
            <View style={styles.bookmarkHeader}>
              <Text style={styles.bookmarkHeaderText}>Durak {index + 1}</Text>
              {editable && onRemoveBookmark && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onRemoveBookmark(bookmark?.id)}
                >
                  <Icon name="close-circle" size={22} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.imageSelector}
              onPress={() => onImageSelect && onImageSelect(bookmark?.id)}
            >
              {bookmark?.image || bookmark?.imageUri ? (
                <Image source={{ uri: bookmark.image || bookmark.imageUri }} style={styles.bookmarkImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Icon name="image-outline" size={30} color="#999" />
                  <Text style={styles.placeholderText}>Resim Ekle</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Başlık</Text>
              <TextInput
                style={styles.textInput}
                value={bookmark?.title || ''}
                onChangeText={(text) => onUpdateBookmark && onUpdateBookmark(bookmark?.id, 'title', text)}
                placeholder="Durak başlığı"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Açıklama</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={bookmark?.description || ''}
                onChangeText={(text) => onUpdateBookmark && onUpdateBookmark(bookmark?.id, 'description', text)}
                placeholder="Durak açıklaması"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        ))}
      </ScrollView>
      
      {bookmarks.length < MAX_BOOKMARKS && onAddBookmark && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={onAddBookmark}
        >
          <Text style={styles.addButtonText}>Yeni durak</Text>
          <Icon name="plus-circle" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#222',
  },
  listContainer: {
    paddingBottom: 16,
  },
  bookmarkItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookmarkHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  imageSelector: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  bookmarkImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#555',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 4,
  },
});

export default BookmarkList;

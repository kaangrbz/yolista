import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/MaterialIcons';
import {Colors} from 'react-native/Libraries/NewAppScreen';

const {width} = Dimensions.get('window');

// Demo data - in real app, this would come from navigation params
const routeData = {
  id: 1,
  title: 'Kemeraltı Turu',
  mainImage: 'https://picsum.photos/800/400',
  author: {
    name: 'Kaan',
    username: '@kaangrbz',
    isVerified: true,
  },
  bookmarks: [
    {
      id: 1,
      title: 'Kemeraltı Çarşısı',
      image: 'https://picsum.photos/800/401',
      note: 'Tarihi çarşıda alışveriş yapabilir, yerel lezzetleri tadabilirsiniz.',
      likes: 234,
      isLiked: false,
      isSaved: false,
    },
    {
      id: 2,
      title: 'Saat Kulesi',
      image: 'https://picsum.photos/800/402',
      note: "İzmir'in simgesi olan tarihi saat kulesi. Fotoğraf çekmek için ideal.",
      likes: 156,
      isLiked: true,
      isSaved: true,
    },
    {
      id: 3,
      title: 'Kızlarağası Hanı',
      image: 'https://picsum.photos/800/403',
      note: 'Osmanlı döneminden kalma tarihi han. İçinde birçok hediyelik eşya dükkanı bulunuyor.',
      likes: 89,
      isLiked: false,
      isSaved: false,
    },
  ],
};

export const RouteDetailScreen = ({navigation}: any) => {
  const isDarkMode = useColorScheme() === 'dark';

  const handleLike = (bookmarkId: number) => {
    // TODO: Implement like functionality
    console.log('Like bookmark:', bookmarkId);
  };

  const handleSave = (bookmarkId: number) => {
    // TODO: Implement save functionality
    console.log('Save bookmark:', bookmarkId);
  };

  const handleShare = (bookmarkId: number) => {
    // TODO: Implement share functionality
    console.log('Share bookmark:', bookmarkId);
  };

  const renderBookmark = (bookmark: (typeof routeData.bookmarks)[0]) => (
    <View key={bookmark.id} style={styles.bookmarkCard}>
      <Image source={{uri: bookmark.image}} style={styles.bookmarkImage} />
      <View style={styles.bookmarkContent}>
        <Text style={styles.bookmarkTitle}>{bookmark.title}</Text>
        <Text style={styles.bookmarkNote}>{bookmark.note}</Text>
        <View style={styles.bookmarkActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(bookmark.id)}>
            <Icon
              name={bookmark.isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={bookmark.isLiked ? '#ff4757' : '#666'}
            />
            <Text style={styles.actionText}>{bookmark.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSave(bookmark.id)}>
            <Icon
              name={bookmark.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={bookmark.isSaved ? '#2ecc71' : '#666'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(bookmark.id)}>
            <Icon name="share-variant" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? Colors.darker : Colors.lighter},
      ]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{uri: routeData.mainImage}} style={styles.mainImage} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{routeData.author.name}</Text>
              {routeData.author.isVerified && (
                <Icon
                  name="check-decagram"
                  size={16}
                  color="#1DA1F2"
                  style={styles.verifiedIcon}
                />
              )}
              <Text style={styles.authorUsername}>
                {routeData.author.username}
              </Text>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Icon name="dots-vertical" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{routeData.title}</Text>
          <View style={styles.bookmarksContainer}>
            {routeData.bookmarks.map(renderBookmark)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainImage: {
    width: width,
    height: width * 0.6,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  authorUsername: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  moreButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  bookmarksContainer: {
    gap: 16,
  },
  bookmarkCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookmarkImage: {
    width: '100%',
    height: 200,
  },
  bookmarkContent: {
    padding: 16,
  },
  bookmarkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  bookmarkNote: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  bookmarkActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
});

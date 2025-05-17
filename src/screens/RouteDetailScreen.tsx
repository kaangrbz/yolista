import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/MaterialIcons';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import RouteModel from '../model/routes.model';
import Seperator from '../components/Seperator';
import { getRandomNumber } from '../utils/math';
import { Images } from '../assets';
import { navigate, PageName } from '../types/navigation';
import { AuthorInfo, CommentSection, ReactionSection, SeperatorLine } from '../components';

const { width } = Dimensions.get('window');

// Demo data - in real app, this would come from navigation params

export const RouteDetailScreen = ({ navigation, route }: { navigation: any, route: { params: { routeId: string } } }) => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [routeData, setRouteData] = useState<any>({});
  const routeId = route.params.routeId;

  useEffect(()=> {
    const loadRoute = async () => {
      try {
        let route = await RouteModel.getRouteAndBookmarksById(routeId)
        
        setTimeout(() => {
          setRouteData(route);
        setIsPageLoading(false)
        }, getRandomNumber(200, 500));
        console.log('route -< ', route);
        
      } catch (error) {
        console.error(error);
      }
    }

    loadRoute();
  }, [])

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
      <Image source={{ uri: bookmark.image_url || 'https://picsum.photos/seed/picsum/200/300' }} style={styles.bookmarkImage} />
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
    <View style={[styles.container, { backgroundColor: Colors.lighter }]}>
      {isPageLoading ?
        <View style={{display: 'flex', alignItems: 'center', justifyContent: 'center' , height: '100%'}}><ActivityIndicator size='small' /></View>
        : (<ScrollView showsVerticalScrollIndicator={false}>
          <Image source={{ uri: routeData.image_url }} style={styles.mainImage} />
          <View>

            <AuthorInfo
              fullName={routeData.profiles.full_name}
              isVerified={routeData.profiles.isVerified}
              username={routeData.profiles.username}
              createdAt={routeData.created_at}
              authorId={routeData.profiles.id}
              loggedUserId={routeData.profiles.id}
              routeId={routeId}
            />
            <Text style={styles.title}>{routeData.title}</Text>
            <Text style={styles.description}>{routeData.description}</Text>
            <ReactionSection />
            <SeperatorLine />
            <CommentSection parentType="routeDetail" />
            <SeperatorLine />
            <View style={styles.bookmarksContainer}>
              {routeData.bookmarks.map(renderBookmark)}
            </View>
          </View>

        </ScrollView>)
      }

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
    paddingHorizontal: 10,  
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginVertical: 5,
    paddingHorizontal: 10,
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

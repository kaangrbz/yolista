import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthorInfo from '../AuthorInfo';
import { RouteWithProfile } from '../../model/routes.model';

interface RouteCardProps {
  route: RouteWithProfile;
  userId: string | null;
  onPress: (routeId: string) => void;
  onRefresh: () => void;
  expandedDescriptions: { [key: string]: boolean };
  onToggleDescription: (routeId: string) => void;
  showAuthorHeader?: boolean;
  showConnectingLine?: boolean;
  isLastItem?: boolean;
}

const RouteCard: React.FC<RouteCardProps> = ({
  route,
  userId,
  onPress,
  onRefresh,
  expandedDescriptions,
  onToggleDescription,
  showAuthorHeader = true,
  showConnectingLine = false,
  isLastItem = false,
}) => {
  const routeKey = String(route.id ?? '');
  const [isExpanded, setIsExpanded] = useState(expandedDescriptions[routeKey] || false);

  // Handle text layout if needed
  const handleTextLayout = (e: any, key: string) => {
    // Implementation if needed
  };

  // Ensure we have valid values for required props
  const safeFullName = route.profiles?.full_name || 'Unknown User';
  const safeUsername = route.profiles?.username || 'unknown';
  const safeCreatedAt = route.created_at || new Date().toISOString();
  const safeAuthorId = route.user_id || '';
  const safeRouteId = route.id || ''; // Ensure we have a valid route ID

  return (
    <View style={[styles.cardContainer, showConnectingLine && styles.withConnectingLine]}>
      {showConnectingLine && (
        <View style={[styles.connectingLine, isLastItem && styles.connectingLineLast]} />
      )}
      <TouchableOpacity
        style={styles.routeCard}
        onPress={() => onPress(route.id || '')}>
        {showAuthorHeader && (
          <AuthorInfo 
            fullName={safeFullName}
            isVerified={route.profiles?.is_verified || false}
            username={safeUsername}
            createdAt={safeCreatedAt}
            authorId={safeAuthorId}
            callback={onRefresh}
            loggedUserId={userId}
            routeId={safeRouteId}
            cityName={route.cities?.name || ''}
          />
        )}
      <Image
        source={{ uri: route.image_url || 'https://picsum.photos/800/500?random=' + route.id  }}
        style={styles.routeImage}
        resizeMode="cover"
      />
      <View style={styles.routeInfo}>
        <Text style={styles.routeTitle}>{route.title}</Text>
        {route.description && (
          <>
            <Text
              style={styles.routeDescription}
              numberOfLines={isExpanded ? undefined : 3}
              onTextLayout={e => handleTextLayout(e, routeKey)}
            >
              {route.description}
            </Text>
            {route.description?.length > 140 && (
              <TouchableOpacity style={styles.seeMoreText} onPress={() => onToggleDescription(routeKey)}>
                <Text
                style={styles.seeMoreText}
                >
                {isExpanded ? 'daha az' : 'daha fazla'}
              </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={styles.reactionContainer}>
          <TouchableOpacity style={styles.reactionItem}>
            <Icon name="comment-outline" size={18} color="#121" />
            <Text style={styles.reactionText}>{0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem}>
            <Icon name="heart-outline" size={18} color="#c00" />
            <Text style={styles.reactionText}>{route.like_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem}>
            <Icon name="eye-outline" size={18} color="#121" />
            <Text style={styles.reactionText}>{0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem}>
            <Icon name="bookmark-outline" size={18} color="#121" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem}>
            <Icon name="share-variant" size={18} color="#121" />
          </TouchableOpacity>
        </View>
        <View style={[styles.commentContainer, {display: 'none'}]}>
          <View style={styles.commentInputContainer}>
            <Image
              source={{
                uri: route.image_url || 'https://picsum.photos/20/20',
              }}
              style={styles.commentImage}
            />
            <TextInput
              placeholder="Yorum yap"
              placeholderTextColor="#666"
              style={styles.commentInput}
            />
            <TouchableOpacity>
              <Icon name="send" size={20} color="#121" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </TouchableOpacity>
    </View>
  );
};

const CONNECTING_LINE_WIDTH = 2;
const CONNECTING_LINE_COLOR = '#e1e8ed';

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
  },
  withConnectingLine: {
    paddingLeft: 16,
  },
  connectingLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: CONNECTING_LINE_WIDTH,
    backgroundColor: CONNECTING_LINE_COLOR,
  },
  connectingLineLast: {
    height: 24, // Adjust this value based on your design
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeImage: {
    width: '100%',
    height: 200,
  },
  routeInfo: {
    padding: 16,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#121212',
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
    lineHeight: 20,
  },
  seeMoreText: {
    color: '#007AFF',
    fontSize: 14,
    marginBottom: 12,
  },
  reactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionText: {
    marginLeft: 4,
    color: '#666',
  },
  commentContainer: {
    marginTop: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontSize: 14,
    color: '#121212',
  },
});

export default RouteCard;

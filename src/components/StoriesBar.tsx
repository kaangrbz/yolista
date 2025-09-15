import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { DefaultAvatar } from '../assets';

interface Story {
  id: string;
  username: string;
  image_url?: string;
  isViewed?: boolean;
}

interface StoriesBarProps {
  stories: Story[];
  onStoryPress?: (storyId: string) => void;
  onAddStory?: () => void;
}

const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  onStoryPress,
  onAddStory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Story Button */}
        <TouchableOpacity style={styles.storyItem} onPress={onAddStory}>
          <View style={styles.addStoryContainer}>
            <Image source={DefaultAvatar} style={styles.addStoryImage} />
            <View style={styles.addStoryIcon}>
              <Text style={styles.addStoryText}>+</Text>
            </View>
          </View>
          <Text style={styles.storyUsername} numberOfLines={1}>
            Hikayeniz
          </Text>
        </TouchableOpacity>

        {/* Story Items */}
        {stories.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={styles.storyItem}
            onPress={() => onStoryPress?.(story.id)}
          >
            <View style={[
              styles.storyImageContainer,
              story.isViewed ? styles.viewedStory : styles.unviewedStory,
            ]}>
              <Image
                source={story.image_url ? { uri: story.image_url } : DefaultAvatar}
                style={styles.storyImage}
              />
            </View>
            <Text style={styles.storyUsername} numberOfLines={1}>
              {story.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  addStoryContainer: {
    position: 'relative',
  },
  addStoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  addStoryIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0095f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  addStoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  storyImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    marginBottom: 4,
  },
  unviewedStory: {
    backgroundColor: '#d63384',
  },
  viewedStory: {
    backgroundColor: '#e9ecef',
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  storyUsername: {
    fontSize: 12,
    color: '#262626',
    textAlign: 'center',
    maxWidth: 70,
  },
});

export default StoriesBar;

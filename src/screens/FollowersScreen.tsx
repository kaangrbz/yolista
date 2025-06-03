import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Profile } from '../model/profile.model';
import { FollowersHeader } from '../components/header/Header';
import UserCard from '../components/user/UserCard';
import { useIsFocused } from '@react-navigation/native';

export const FollowersScreen = ({ navigation, route }: { navigation: any, route: { params: { userId: string } } }) => {
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userId = route.params.userId;
  const isFocused = useIsFocused();

  const loadFollowers = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower:profiles!follows_follower_id_fkey (
            id,
            username,
            full_name,
            image_url,
            is_verified
          )
        `)
        .eq('followed_id', userId);

      if (error) throw error;

      const followersList = data.map(item => item.follower);
      setFollowers(followersList);
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFollowers();
  }, [userId, isFocused]);

  return (
    <SafeAreaView style={styles.container}>
      <FollowersHeader navigation={navigation} />
      <FlatList
        data={followers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onPress={() => navigation.navigate('ProfileMain', { userId: item.id })}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Bu kullanıcı henüz kimse tarafından takip edilmiyor</Text>}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Profile } from '../model/profile.model';
import { FollowingHeader } from '../components/header/Header';
import UserCard from '../components/user/UserCard';
import { useIsFocused } from '@react-navigation/native';

export const FollowingScreen = ({ navigation, route }: { navigation: any, route: { params: { userId: string } } }) => {
  const [following, setFollowing] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userId = route.params.userId;
  const isFocused = useIsFocused();

  const loadFollowing = async () => {
    try {
      const { data, error } = await supabase
              .from('follows')
              .select(`
                followed:profiles!follows_followed_id_fkey (
                  id,
                  username,
                  full_name,
                  image_url,
                  is_verified
                )
              `)
              .eq('follower_id', userId);

      if (error) throw error;

      const followingList = data.map(item => item.followed);
      setFollowing(followingList);
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFollowing();
  }, [userId, isFocused]);

  return (
    <SafeAreaView style={styles.container}>
      <FollowingHeader navigation={navigation} />
      <FlatList
        data={following}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onPress={() => navigation.navigate('ProfileMain', { userId: item.id })}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Kullanıcı kimseyi takip etmiyor</Text>}
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
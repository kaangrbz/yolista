import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { RouteDetailHeader } from '../components/header/Header';
import UniversalPost from '../components/UniversalPost';

export const RouteDetailScreen = ({ navigation, route }: { navigation: any, route: { params: { routeId: string } } }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const routeId = route.params.routeId;

  // Fetch current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUserId();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <RouteDetailHeader navigation={navigation} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <UniversalPost
          postId={routeId}
          userId={userId}
          showFullScreen={true}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
});

export default RouteDetailScreen;
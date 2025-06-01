import React from 'react';
import { FlatList, View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import RouteCard from './RouteCard';
import { RouteWithProfile } from '../../model/routes.model';

interface RouteListProps {
  routes: RouteWithProfile[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onRoutePress: (routeId: string) => void;
  onRefreshRoutes: () => void;
  expandedDescriptions: { [key: string]: boolean };
  onToggleDescription: (routeId: string) => void;
  userId: string | null;
}

const RouteList: React.FC<RouteListProps> = ({
  routes,
  loading,
  refreshing,
  onRefresh,
  onRoutePress,
  onRefreshRoutes,
  expandedDescriptions,
  onToggleDescription,
  userId,
}) => {
  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#222" />
        </View>
      );
    }
    return null;
  };

  const renderEmptyComponent = () => (
    <View style={styles.noRoutesContainer}>
      <Text style={styles.noRoutesText}>
        Rota bulunamadı, hemen aşağıdaki butona tıklayarak yeni bir rota oluştur!
      </Text>
    </View>
  );

  return (
    <FlatList
      data={routes}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item }) => (
        <RouteCard
          route={item}
          userId={userId}
          onPress={onRoutePress}
          onRefresh={onRefreshRoutes}
          expandedDescriptions={expandedDescriptions}
          onToggleDescription={onToggleDescription}
        />
      )}
      contentContainerStyle={styles.routesContainer}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyComponent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} 
        colors={['#333', '#121212']}
        tintColor="#000000"
        titleColor="#000000"

        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  routesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRoutesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noRoutesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default RouteList;

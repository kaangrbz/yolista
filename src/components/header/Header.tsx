import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {PageName} from '../../types/navigation';

// components/headers/BaseHeader.tsx
type HeaderProps = {
  title?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  centerTitle?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const BaseHeader = ({
  title,
  leftComponent,
  rightComponent,
  centerTitle = false,
  style = {},
}: HeaderProps) => (
  <View style={[styles.header, style]}>
    {leftComponent && <View style={styles.leftSection}>{leftComponent}</View>}

    {title && (
      <Text
        style={[styles.title, centerTitle && styles.centered]}
        numberOfLines={1}>
        {title}
      </Text>
    )}

    {rightComponent ? (
      <View style={styles.rightSection}>{rightComponent}</View>
    ) : (
      <Text style={styles.rightPlaceholder}>&nbsp;</Text>
    )}
  </View>
);

// components/headers/HomeHeader.tsx
export const HomeHeader = () => <BaseHeader title="Yolista" centerTitle />;

// components/headers/RouteDetailHeader.tsx
export const RouteDetailHeader = ({navigation}: {navigation?: any}) => (
  <BaseHeader
    title="Rota Detayı"
    style={{justifyContent: 'space-between'}}
    leftComponent={
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#000" />
      </TouchableOpacity>
    }
  />
);

// components/headers/ExploreHeader.tsx
export const ExploreHeader = ({onSearch}) => <BaseHeader title="Keşfet" />;

export const CreateRouteHeader = () => {
  return <BaseHeader title="Yeni Rota Oluştur" />;
};

export const NotificationsHeader = () => {
  return (
    <BaseHeader
      title="Bildirimler"
      rightComponent={
        <TouchableOpacity>
          <Icon name="dots-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      }
    />
  );
};

export const FollowersHeader = ({navigation}: {navigation: any}) => {
  return (
    <BaseHeader
      title="Takipçiler"
      style={{justifyContent: 'flex-start', gap: 16}}
      leftComponent={
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#121212" />
        </TouchableOpacity>
      }
    />
  );
};

export const FollowingHeader = ({navigation}: {navigation: any}) => {
  return (
    <BaseHeader
      title="Takip Edilenler"
      style={{justifyContent: 'flex-start', gap: 16}}
      leftComponent={
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#121212" />
        </TouchableOpacity>
      }
    />
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchButton: {
    padding: 8,
  },
  homepageHeader: {
    textAlign: 'center',
    width: '100%',
    fontSize: 18,
  },
  leftSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '10%',
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '10%',
  },
  centered: {
    textAlign: 'center',
    width: '100%',
  },
  placeholder: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  backButton: {
    padding: 8,
  },
  rightPlaceholder: {
    width: 24,
    height: 24,
  },
});

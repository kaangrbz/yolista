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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { appTheme } from '../../theme/appTheme';
import { NotificationBellButton } from './NotificationBellButton';

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
    <View style={styles.sideSlot}>
      {leftComponent ?? <View style={styles.headerSideSpacer} />}
    </View>

    {title ? (
      <Text
        style={[
          styles.title,
          centerTitle ? styles.titleCentered : styles.titleStart,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
    ) : (
      <View style={styles.titleFlex} />
    )}

    <View style={styles.sideSlot}>
      {rightComponent ?? <View style={styles.headerSideSpacer} />}
    </View>
  </View>
);

const useNotificationsNavigation = () => {
  const navigation = useNavigation<any>();
  const { unreadNotificationCount } = useAuth();

  const openNotifications = () => {
    navigation.navigate('Notifications');
  };

  return { unreadNotificationCount, openNotifications };
};

// components/headers/HomeHeader.tsx
export const HomeHeader = () => {
  const { unreadNotificationCount, openNotifications } = useNotificationsNavigation();

  return (
    <BaseHeader
      title="Yolista"
      centerTitle
      rightComponent={
        <NotificationBellButton
          count={unreadNotificationCount}
          onPress={openNotifications}
        />
      }
    />
  );
};

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
export const ExploreHeader = () => {
  const { unreadNotificationCount, openNotifications } = useNotificationsNavigation();

  return (
    <BaseHeader
      title="Keşfet"
      rightComponent={
        <NotificationBellButton
          count={unreadNotificationCount}
          onPress={openNotifications}
        />
      }
    />
  );
};

export const CreateRouteHeader = () => {
  return <BaseHeader title="Yeni Rota Oluştur" />;
};

export const NotificationsHeader = ({ navigation }: { navigation?: { goBack: () => void } }) => {
  const fallbackNavigation = useNavigation<any>();
  const nav = navigation ?? fallbackNavigation;

  return (
    <BaseHeader
      title="Bildirimler"
      leftComponent={
        <TouchableOpacity
          onPress={() => nav.goBack()}
          style={styles.backHit}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <Icon name="arrow-left" size={22} color={appTheme.textPrimary} />
        </TouchableOpacity>
      }
    />
  );
};

export const SocialListHeader = ({
  navigation,
  title,
}: {
  navigation: any;
  title: string;
}) => {
  return (
    <View style={socialListHeaderStyles.wrap}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={socialListHeaderStyles.backHit}
        accessibilityRole="button"
        accessibilityLabel="Geri"
      >
        <Icon name="arrow-left" size={22} color="#121212" />
      </TouchableOpacity>
      <Text style={socialListHeaderStyles.screenTitle}>{title}</Text>
    </View>
  );
};

export const FollowersHeader = ({ navigation }: { navigation: any }) => {
  return <SocialListHeader navigation={navigation} title="Takipçiler" />;
};

export const FollowingHeader = ({ navigation }: { navigation: any }) => {
  return <SocialListHeader navigation={navigation} title="Takip Edilenler" />;
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: appTheme.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  backHit: {
    padding: 8,
  },
  searchButton: {
    padding: 8,
  },
  homepageHeader: {
    textAlign: 'center',
    width: '100%',
    fontSize: 18,
  },
  sideSlot: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleFlex: {
    flex: 1,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: appTheme.textPrimary,
    letterSpacing: -0.35,
  },
  titleCentered: {
    textAlign: 'center',
  },
  titleStart: {
    textAlign: 'left',
  },
  headerSideSpacer: {
    width: 40,
    height: 40,
  },
});

const socialListHeaderStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    gap: 4,
  },
  backHit: {
    padding: 8,
    marginRight: 4,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: -0.35,
    flex: 1,
  },
});

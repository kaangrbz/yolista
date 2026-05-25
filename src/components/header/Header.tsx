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
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { NotificationBellButton } from './NotificationBellButton';

type HeaderProps = {
  title?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  centerTitle?: boolean;
  style?: StyleProp<ViewStyle>;
};

const useHeaderStyles = () =>
  useThemedStyles((theme) => ({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 14,
      backgroundColor: theme.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.hairlineBorder,
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
      color: theme.textPrimary,
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
  }));

export const BaseHeader = ({
  title,
  leftComponent,
  rightComponent,
  centerTitle = false,
  style = {},
}: HeaderProps) => {
  const styles = useHeaderStyles();

  return (
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
};

const useNotificationsNavigation = () => {
  const navigation = useNavigation<any>();
  const { unreadNotificationCount } = useAuth();

  const openNotifications = () => {
    navigation.navigate('Notifications');
  };

  return { unreadNotificationCount, openNotifications };
};

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

export const RouteDetailHeader = ({ navigation }: { navigation?: any }) => {
  const theme = useAppTheme();

  return (
    <BaseHeader
      title="Rota Detayı"
      style={{ justifyContent: 'space-between' }}
      leftComponent={
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      }
    />
  );
};

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
  const theme = useAppTheme();
  const fallbackNavigation = useNavigation<any>();
  const nav = navigation ?? fallbackNavigation;
  const styles = useHeaderStyles();

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
          <Icon name="arrow-left" size={22} color={theme.textPrimary} />
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
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 14,
      backgroundColor: t.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.hairlineBorder,
      gap: 4,
    },
    backHit: {
      padding: 8,
      marginRight: 4,
    },
    screenTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: t.textPrimary,
      letterSpacing: -0.35,
      flex: 1,
    },
  }));

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backHit}
        accessibilityRole="button"
        accessibilityLabel="Geri"
      >
        <Icon name="arrow-left" size={22} color={theme.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.screenTitle}>{title}</Text>
    </View>
  );
};

export const FollowersHeader = ({ navigation }: { navigation: any }) => {
  return <SocialListHeader navigation={navigation} title="Takipçiler" />;
};

export const FollowingHeader = ({ navigation }: { navigation: any }) => {
  return <SocialListHeader navigation={navigation} title="Takip Edilenler" />;
};

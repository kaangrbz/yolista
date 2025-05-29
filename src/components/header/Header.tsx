import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PageName } from '../../types/navigation';

// components/headers/BaseHeader.tsx
type HeaderProps = {
  title: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  centerTitle?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const BaseHeader = ({
  title,
  leftComponent,
  rightComponent,
  centerTitle = false,
  style = { }
}: HeaderProps) => (
  <View style={[styles.header, centerTitle && styles.centered, style]}>
    {leftComponent && (<View style={styles.leftSection}>
      {leftComponent}
    </View>)}

    <Text style={styles.title} numberOfLines={1}>
      {title}
    </Text>

    {rightComponent && (<View style={styles.rightSection}>
      {rightComponent}
    </View>)}
  </View>
);

// components/headers/HomeHeader.tsx
export const HomeHeader = () => (
  <BaseHeader
    title="Yolista Kaan gürbüz"
    centerTitle
  />
);

// components/headers/ExploreHeader.tsx
export const ExploreHeader = ({ onSearch }) => (
  <BaseHeader
    title="Keşfet"
    rightComponent={
      <TouchableOpacity onPress={onSearch}>
        <Icon name="magnify" size={18} color="#000" />
      </TouchableOpacity>
    }
  />
);

export const CreateRouteHeader = () => {
  return (
    <BaseHeader

      title="Yeni Rota Oluştur"
    />
  );
}

export const NotificationsHeader = () => {
  return (
    <BaseHeader
      title="Bildirimler Deneme"
      rightComponent={
        <TouchableOpacity>
          <Icon name="dots-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
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
    justifyContent: 'center',
    alignItems: 'center',
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
});

import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Icon as YolistaIcon} from '../assets';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  color = '#1DA1F2',
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return {icon: 24, text: 16};
      case 'large':
        return {icon: 48, text: 32};
      default:
        return {icon: 32, text: 24};
    }
  };

  const sizes = getSize();

  return (
    <View style={styles.container}>
      <Image source={YolistaIcon} style={{width: sizes.icon, height: sizes.icon}} resizeMode="contain" />
      <Text style={[styles.text, {fontSize: sizes.text, color}]}>Yolista</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

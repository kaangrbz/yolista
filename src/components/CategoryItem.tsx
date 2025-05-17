import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CategoryItemProps {
  name: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ name, icon, selected, onPress, style }) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        { backgroundColor: selected ? '#121212dd' : '#666' },
        style,
      ]}
      onPress={onPress}
    >
      {/* Uncomment if using icons for categories */}
      {/* {icon && <Icon name={icon} size={24} color="white" style={styles.icon} />} */}
      <Text style={styles.categoryText}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // icon: {
  //   marginRight: 8,
  // },
});

export default CategoryItem;

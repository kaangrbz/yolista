import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { FloatingAction } from 'react-native-floating-action';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface LoadingFloatingActionProps {
  onPress?: () => Promise<void>;
  onPressItem?: (name: string) => void;
  iconName?: string;
  iconColor?: string;
  iconSize?: number;
  backgroundColor?: string;
  position?: 'right' | 'left' | 'center';
  isVisible?: boolean;
  actions?: any[];
  isDisabled?: boolean;
}

export const LoadingFloatingAction: React.FC<LoadingFloatingActionProps> = ({
  onPress,
  onPressItem,
  iconName = 'content-save-edit-outline',
  iconColor = 'white',
  iconSize = 30,
  backgroundColor = '#4AA96C',
  position = 'right',
  isVisible = true,
  actions = [],
  isDisabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (onPress) {
      setIsLoading(true);
      await onPress(); // Call the onPress function passed from the parent
      setIsLoading(false);
    }
  };

  return (
    <FloatingAction
      actions={actions}
      visible={isVisible}
      color={backgroundColor}
      position={position}
      onPressItem={onPressItem || ((name?: string) => {})}
      showBackground={false}
      floatingIcon={
        isLoading ? (
          <ActivityIndicator size={iconSize} color={iconColor} />
        ) : (
          <Icon size={iconSize} color={iconColor} name={iconName} />
        )
      }
      onPressMain={isLoading || isDisabled ? undefined : handlePress}
    />
  );
};

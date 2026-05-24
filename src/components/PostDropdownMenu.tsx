import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface DropdownOption {
  id: string;
  title: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

interface PostDropdownMenuProps {
  isOwnPost: boolean;
  isFollowing?: boolean;
  onReport?: () => void;
  onBlock?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onCopyLink?: () => void;
}

const PostDropdownMenu: React.FC<PostDropdownMenuProps> = ({
  isOwnPost,
  isFollowing = false,
  onReport,
  onBlock,
  onFollow,
  onUnfollow,
  onEdit,
  onDelete,
  onShare,
  onCopyLink,
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<View>(null);

  const handleOpen = () => {
    if (triggerRef.current) {
      triggerRef.current.measure((_fx: number, _fy: number, width: number, height: number, px: number, py: number) => {
        const screenWidth = Dimensions.get('window').width;
        const menuWidth = 200;
        const rightPosition = screenWidth - px - width - 10;

        setPosition({
          x: Math.max(10, rightPosition),
          y: py + height + 5,
        });
        setVisible(true);
      });
    }
  };

  const handleClose = () => {
    setVisible(false);
  };

  const getMenuOptions = (): DropdownOption[] => {
    if (isOwnPost) {
      return [
        {
          id: 'edit',
          title: 'Düzenle',
          icon: 'pencil',
          onPress: () => {
            onEdit?.();
            handleClose();
          },
        },
        {
          id: 'share',
          title: 'Paylaş',
          icon: 'share',
          onPress: () => {
            onShare?.();
            handleClose();
          },
        },
        {
          id: 'copy',
          title: 'Linki Kopyala',
          icon: 'content-copy',
          onPress: () => {
            onCopyLink?.();
            handleClose();
          },
        },
        {
          id: 'delete',
          title: 'Sil',
          icon: 'delete',
          color: '#ff4444',
          onPress: () => {
            onDelete?.();
            handleClose();
          },
        },
      ];
    } else {
      const options: DropdownOption[] = [
        {
          id: 'share',
          title: 'Paylaş',
          icon: 'share',
          onPress: () => {
            onShare?.();
            handleClose();
          },
        },
        {
          id: 'copy',
          title: 'Linki Kopyala',
          icon: 'content-copy',
          onPress: () => {
            onCopyLink?.();
            handleClose();
          },
        },
      ];

      if (isFollowing) {
        options.push({
          id: 'unfollow',
          title: 'Takibi Bırak',
          icon: 'account-remove',
          onPress: () => {
            onUnfollow?.();
            handleClose();
          },
        });
      } else {
        options.push({
          id: 'follow',
          title: 'Takip Et',
          icon: 'account-plus',
          onPress: () => {
            onFollow?.();
            handleClose();
          },
        });
      }

      options.push(
        {
          id: 'report',
          title: 'Şikayet Et',
          icon: 'flag',
          color: '#ff4444',
          onPress: () => {
            onReport?.();
            handleClose();
          },
        },
        {
          id: 'block',
          title: 'Engelle',
          icon: 'block-helper',
          color: '#ff4444',
          onPress: () => {
            onBlock?.();
            handleClose();
          },
        }
      );

      return options;
    }
  };

  const menuOptions = getMenuOptions();

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <TouchableOpacity
          style={styles.trigger}
          onPress={handleOpen}
          activeOpacity={0.7}>
          <Icon name="dots-horizontal" size={24} color="#262626" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <View
              style={[
                styles.menu,
                {
                  top: position.y,
                  right: position.x,
                },
              ]}>
              {menuOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.menuItem}
                  onPress={option.onPress}
                  activeOpacity={0.7}>
                  <Icon
                    name={option.icon}
                    size={20}
                    color={option.color || '#262626'}
                    style={styles.menuIcon}
                  />
                  <Text
                    style={[
                      styles.menuText,
                      option.color && { color: option.color },
                    ]}>
                    {option.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    padding: 8,
    borderRadius: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuIcon: {
    marginRight: 12,
    width: 20,
  },
  menuText: {
    fontSize: 16,
    color: '#262626',
    fontWeight: '500',
  },
});

export default PostDropdownMenu;

import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ModalSheetSafeArea from '../common/ModalSheetSafeArea';
import { StopReorderList } from './StopReorderList';
import type { CreateFlowPhoto } from '../../types/createRouteFlowTypes';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface StopReorderSheetProps {
  visible: boolean;
  photos: CreateFlowPhoto[];
  onClose: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export const StopReorderSheet: React.FC<StopReorderSheetProps> = ({
  visible,
  photos,
  onClose,
  onReorder,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    overlay: {
      flex: 1,
      backgroundColor: t.overlayDark,
      justifyContent: 'flex-end',
    },
    sheetWrap: {
      maxHeight: '75%',
    },
    sheet: {
      backgroundColor: t.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 16,
      paddingBottom: 16,
      minHeight: 240,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.borderStrong,
      marginTop: 8,
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: t.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      color: t.textSecondary,
      marginBottom: 12,
      lineHeight: 18,
    },
    closeButton: {
      padding: 4,
    },
    doneButton: {
      marginTop: 12,
      backgroundColor: t.buttonPrimaryBg,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    doneButtonText: {
      color: t.buttonPrimaryText,
      fontSize: 16,
      fontWeight: '600',
    },
  }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheetWrap} onPress={(event) => event.stopPropagation()}>
          <ModalSheetSafeArea style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>Sıralamayı düzenle</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              Fotoğrafları sürükleyerek carousel sırasını değiştir.
            </Text>
            <GestureHandlerRootView style={{ flexGrow: 1 }}>
              <StopReorderList photos={photos} onReorder={onReorder} />
            </GestureHandlerRootView>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Tamam</Text>
            </TouchableOpacity>
          </ModalSheetSafeArea>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default StopReorderSheet;

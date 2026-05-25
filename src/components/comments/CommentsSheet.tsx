import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { showConfirm } from '../common/ConfirmModal';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type {
  BottomSheetBackdropProps,
  BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import CommentModel, { Comment } from '../../model/comment.model';
import { showToast } from '../../utils/alert';
import Seperator from '../Seperator';
import { buildProfileNavigationParams } from '../../utils/profileSlug';
import { getTimeAgo } from '../../utils/timeAgo';
import CachedProfileAvatar from '../common/CachedProfileAvatar';
import { useAuth } from '../../context/AuthContext';
import type { CommentsParentType } from '../../context/CommentsSheetContext';
import {
  getCachedCommentDraft,
  getCachedRouteComments,
  isRouteCommentsCacheStale,
  prependCachedRouteComment,
  removeCachedRouteCommentByIdPrefix,
  removeCachedRouteComment,
  replaceCachedRouteComment,
  setCachedCommentDraft,
  setCachedRouteComments,
} from '../../services/RouteCommentsCache';

type RootStackParamList = {
  ProfileMain: { username: string; currentUserId?: string };
};

type CommentsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ActiveCommentsState {
  routeId: string;
  routeOwnerId: string;
  parentType: CommentsParentType;
}

interface CommentsSheetProps {
  activeComments: ActiveCommentsState | null;
  onClose: () => void;
  onCommentCountChange?: (routeId: string, count: number) => void;
}

interface CommentItemProps {
  item: Comment;
  navigation: CommentsNavigationProp;
  currentUserId?: string | null;
  onDeletePress?: (commentId: string) => void;
  isDeleting?: boolean;
}

const MAX_CHARACTERS = 280;

const CommentItem: React.FC<CommentItemProps> = ({
  item,
  navigation,
  currentUserId,
  onDeletePress,
  isDeleting = false,
}) => {
  const isOwnComment = !!currentUserId && item.user_id === currentUserId;
  const canDelete = isOwnComment && !item.id.startsWith('temp-') && !!onDeletePress;

  const handleAuthorPress = () => {
    if (!item.profiles?.username) {
      return;
    }

    navigation.navigate(
      'ProfileMain',
      buildProfileNavigationParams({
        username: item.profiles.username,
      }),
    );
  };

  return (
    <View style={styles.commentItem}>
      <CachedProfileAvatar
        userId={item.user_id}
        imageUrl={item.profiles?.image_url}
        imagePreviewUrl={item.profiles?.image_preview_url}
        size={36}
        style={styles.commentAvatarWrap}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeaderRow}>
          <TouchableOpacity
            style={styles.commentAuthorContainer}
            onPress={handleAuthorPress}
            activeOpacity={0.7}
          >
            <Text style={styles.commentAuthor}>{item.profiles?.username}</Text>
            {item.profiles?.is_verified && (
              <>
                <Seperator />
                <Icon
                  name="check-decagram"
                  size={14}
                  color="#1DA1F2"
                  style={styles.verifiedIcon}
                />
              </>
            )}
            <Seperator />
            <Text style={styles.commentTime}>{getTimeAgo(item.created_at)}</Text>
          </TouchableOpacity>

          {canDelete ? (
            <TouchableOpacity
              style={styles.deleteCommentButton}
              onPress={() => onDeletePress?.(item.id)}
              disabled={isDeleting}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Yorumu sil"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#999" />
              ) : (
                <Icon name="trash-can-outline" size={18} color="#999" />
              )}
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );
};

const CommentsSheet: React.FC<CommentsSheetProps> = ({
  activeComments,
  onClose,
  onCommentCountChange,
}) => {
  const sheetRef = useRef<ComponentRef<typeof BottomSheetModal>>(null);
  const navigation = useNavigation<CommentsNavigationProp>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const routeId = activeComments?.routeId ?? '';
  const routeOwnerId = activeComments?.routeOwnerId ?? '';
  const isVisible = !!activeComments;

  const snapPoints = useMemo(() => ['33%', '50%', '88%'], []);

  const publishCommentCount = useCallback(
    (targetRouteId: string, count: number) => {
      if (!targetRouteId) {
        return;
      }

      onCommentCountChange?.(targetRouteId, count);
    },
    [onCommentCountChange],
  );

  const currentUserAvatar = useMemo(() => {
    return {
      imageUrl: user?.profile?.image_url,
      imagePreviewUrl: undefined as string | undefined,
    };
  }, [user?.profile?.image_url]);

  const renderBackdrop = useCallback((backdropProps: BottomSheetBackdropProps) => {
    return (
      <BottomSheetBackdrop
        {...backdropProps}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    );
  }, []);

  const persistDraft = useCallback(
    (draft: string) => {
      if (!routeId) {
        return;
      }

      setCachedCommentDraft(routeId, draft);
    },
    [routeId],
  );

  const loadComments = useCallback(
    async (options?: { showSpinner?: boolean }) => {
      if (!routeId) {
        return;
      }

      const showSpinner = options?.showSpinner ?? false;

      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const fetchedComments = await CommentModel.getRouteComments(routeId);
        setComments(fetchedComments);
        setCachedRouteComments(
          routeId,
          fetchedComments,
          getCachedCommentDraft(routeId),
        );
        publishCommentCount(routeId, fetchedComments.length);
      } catch (error) {
        console.error('Error loading comments:', error);
        showToast('error', 'Yorumlar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [routeId, publishCommentCount],
  );

  const hydrateFromCache = useCallback((targetRouteId: string) => {
    const cached = getCachedRouteComments(targetRouteId);
    const draft = getCachedCommentDraft(targetRouteId);

    if (cached) {
      setComments(cached);
    } else {
      setComments([]);
    }

    setCommentText(draft);
    setLoading(!cached);
  }, []);

  useEffect(() => {
    if (!isVisible || !routeId) {
      return;
    }

    hydrateFromCache(routeId);

    const cached = getCachedRouteComments(routeId);

    if (cached) {
      publishCommentCount(routeId, cached.length);
    }

    if (isRouteCommentsCacheStale(routeId)) {
      void loadComments({ showSpinner: !cached });
    }
  }, [isVisible, routeId, hydrateFromCache, loadComments, publishCommentCount]);

  useEffect(() => {
    if (!isVisible || !routeId) {
      return;
    }

    publishCommentCount(routeId, comments.length);
  }, [comments.length, isVisible, routeId, publishCommentCount]);

  useEffect(() => {
    if (isVisible) {
      sheetRef.current?.present();

      return;
    }

    sheetRef.current?.dismiss();
  }, [isVisible]);

  const handleDismiss = useCallback(() => {
    if (routeId) {
      setCachedRouteComments(routeId, comments, commentText);
    }

    onClose();
  }, [commentText, comments, onClose, routeId]);

  const handleCommentChange = useCallback(
    (text: string) => {
      setCommentText(text);
      persistDraft(text);
    },
    [persistDraft],
  );

  const handleAddComment = async () => {
    if (
      !commentText.trim() ||
      !user?.id ||
      submitting ||
      !routeId ||
      commentText.length > MAX_CHARACTERS
    ) {
      return;
    }

    setSubmitting(true);

    const trimmedContent = commentText.trim();
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      route_id: routeId,
      user_id: user.id,
      content: trimmedContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        username: user.profile?.username || user.email?.split('@')[0] || 'user',
        image_url: user.profile?.image_url,
        full_name: user.profile?.full_name,
        is_verified: user.profile?.is_verified,
      },
    };

    try {
      setComments((prevComments) => [tempComment, ...prevComments]);
      prependCachedRouteComment(routeId, tempComment);
      setCommentText('');
      setCachedCommentDraft(routeId, '');

      const newComment = await CommentModel.addRouteComment(
        routeId,
        user.id,
        trimmedContent,
        routeOwnerId,
      );

      const { data: fullComment } = await supabase
        .from('comments')
        .select('*, profiles(username, image_url, image_preview_url, full_name, is_verified)')
        .eq('id', newComment.id)
        .single();

      if (fullComment) {
        const resolved = fullComment as Comment;

        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === tempComment.id ? resolved : comment,
          ),
        );
        replaceCachedRouteComment(routeId, tempComment.id, resolved);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('error', 'Yorum eklenirken bir hata oluştu');

      setComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== tempComment.id),
      );
      removeCachedRouteCommentByIdPrefix(routeId, 'temp-');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (!user?.id || !routeId || commentId.startsWith('temp-')) {
        return;
      }

      showConfirm({
        title: 'Yorumu Sil',
        message: 'Bu yorumu silmek istediğinizden emin misiniz?',
        icon: 'trash-can-outline',
        iconColor: '#dc2626',
        actions: [
          { key: 'cancel', label: 'İptal', variant: 'ghost' },
          {
            key: 'delete',
            label: 'Sil',
            variant: 'destructive',
            onPress: () => {
              void (async () => {
                setDeletingCommentId(commentId);

                const previousComments = comments;

                setComments((prevComments) =>
                  prevComments.filter((comment) => comment.id !== commentId),
                );
                removeCachedRouteComment(routeId, commentId);
                publishCommentCount(routeId, previousComments.length - 1);

                try {
                  await CommentModel.deleteComment(commentId, user.id);
                  showToast('success', 'Yorum silindi');
                } catch (error) {
                  console.error('Error deleting comment:', error);
                  setComments(previousComments);
                  setCachedRouteComments(
                    routeId,
                    previousComments,
                    getCachedCommentDraft(routeId),
                  );
                  publishCommentCount(routeId, previousComments.length);
                  showToast('error', 'Yorum silinirken bir hata oluştu');
                } finally {
                  setDeletingCommentId(null);
                }
              })();
            },
          },
        ],
      });
    },
    [comments, publishCommentCount, routeId, user?.id],
  );

  const renderCommentItem = useCallback(
    ({ item }: { item: Comment }) => {
      return (
        <CommentItem
          item={item}
          navigation={navigation}
          currentUserId={user?.id}
          onDeletePress={handleDeleteComment}
          isDeleting={deletingCommentId === item.id}
        />
      );
    },
    [deletingCommentId, handleDeleteComment, navigation, user?.id],
  );

  const renderListHeader = useCallback(() => {
    return (
      <View style={styles.sheetHeader}>
        <View style={styles.sheetHandleSpacer} />
        <Text style={styles.commentsTitle}>Yorumlar</Text>
        {loading && comments.length === 0 ? (
          <ActivityIndicator size="small" color="#121212" style={styles.headerSpinner} />
        ) : null}
      </View>
    );
  }, [comments.length, loading]);

  const renderListEmpty = useCallback(() => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyCommentsContainer}>
        <Icon name="comment-text-outline" size={40} color="#d0d0d0" />
        <Text style={styles.emptyCommentsText}>Henüz yorum yok</Text>
        <Text style={styles.emptyCommentsHint}>İlk yorumu sen ol!</Text>
      </View>
    );
  }, [loading]);

  const renderListFooter = useCallback(() => {
    return <View style={styles.listFooterSpacer} />;
  }, []);

  const isSendDisabled =
    submitting || !commentText.trim() || commentText.length > MAX_CHARACTERS;

  const renderFooter = useCallback(
    (footerProps: BottomSheetFooterProps) => {
      return (
        <BottomSheetFooter {...footerProps} bottomInset={insets.bottom}>
          <View style={styles.inputSection}>
            {user?.id ? (
              <CachedProfileAvatar
                userId={user.id}
                imageUrl={currentUserAvatar.imageUrl}
                imagePreviewUrl={currentUserAvatar.imagePreviewUrl}
                size={34}
                style={styles.inputAvatarWrap}
              />
            ) : null}

            <View style={styles.inputFieldWrap}>
              <BottomSheetTextInput
                placeholder="Yorum yap..."
                placeholderTextColor="#888"
                style={styles.commentInput}
                value={commentText}
                onChangeText={handleCommentChange}
                multiline={true}
                maxLength={MAX_CHARACTERS}
              />
              <Text
                style={[
                  styles.characterCount,
                  commentText.length > MAX_CHARACTERS && styles.characterCountWarning,
                ]}
              >
                {commentText.length}/{MAX_CHARACTERS}
              </Text>
            </View>

            <Pressable
              onPress={handleAddComment}
              disabled={isSendDisabled}
              style={({ pressed }) => [
                styles.sendButton,
                isSendDisabled && styles.disabledSendButton,
                pressed && !isSendDisabled && styles.sendButtonPressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon
                  name="send"
                  size={16}
                  color={commentText.trim() ? '#fff' : '#999'}
                />
              )}
            </Pressable>
          </View>
        </BottomSheetFooter>
      );
    },
    [
      commentText,
      currentUserAvatar.imagePreviewUrl,
      currentUserAvatar.imageUrl,
      handleAddComment,
      handleCommentChange,
      insets.bottom,
      isSendDisabled,
      submitting,
      user?.id,
    ],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={1}
      enablePanDownToClose={true}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetIndicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      footerComponent={renderFooter}
    >
      <BottomSheetFlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderCommentItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={renderListFooter}
        contentContainerStyle={styles.listContent}
        style={styles.flatList}
        keyboardShouldPersistTaps="handled"
        enableFooterMarginAdjustment={true}
        refreshing={refreshing}
        onRefresh={() => loadComments({ showSpinner: false })}
      />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetIndicator: {
    backgroundColor: '#d2d2d2',
    width: 40,
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sheetHandleSpacer: {
    height: 4,
  },
  commentsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#121212',
  },
  headerSpinner: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  listFooterSpacer: {
    height: 8,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ebebeb',
  },
  commentAvatarWrap: {
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 8,
  },
  deleteCommentButton: {
    padding: 4,
    marginTop: -2,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1a1a1a',
  },
  commentTime: {
    fontSize: 12,
    color: '#888',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  verifiedIcon: {
    marginHorizontal: 2,
  },
  emptyCommentsContainer: {
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyCommentsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  emptyCommentsHint: {
    marginTop: 6,
    fontSize: 13,
    color: '#999',
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ebebeb',
    backgroundColor: '#fff',
  },
  inputAvatarWrap: {
    marginBottom: 4,
  },
  inputFieldWrap: {
    flex: 1,
    position: 'relative',
  },
  commentInput: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    paddingRight: 52,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 20,
    fontSize: 15,
    minHeight: 42,
    maxHeight: 96,
    backgroundColor: '#f8f8f8',
    color: '#121212',
  },
  characterCount: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    fontSize: 10,
    color: '#aaa',
  },
  characterCountWarning: {
    color: '#ff3b30',
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#0095f6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
  disabledSendButton: {
    backgroundColor: '#e0e0e0',
  },
});

export default CommentsSheet;

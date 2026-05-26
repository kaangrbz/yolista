import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SocialUserListScreen } from '../components/social/SocialUserListScreen';
import { SocialListHeader } from '../components/header/Header';
import {
  isSocialUserListParams,
  type SocialUserListRouteParams,
} from '../types/socialUserList';
import { createSocialUserListFetchPage } from '../utils/createSocialUserListFetchPage';
import { useThemedStyles } from '../theme/useThemedStyles';

type ListMeta = {
  title: string;
  emptyMessage: string;
  summaryLabel: (total: number) => string;
  listKey: string;
  initialTotalHint?: number;
};

function metaForParams(params: SocialUserListRouteParams): ListMeta {
  if (params.kind === 'followers') {
    return {
      title: 'Takipçiler',
      emptyMessage: 'Bu kullanıcı henüz kimse tarafından takip edilmiyor',
      summaryLabel: (total) => `${total} takipçi`,
      listKey: `followers:${params.userId}`,
    };
  }

  if (params.kind === 'following') {
    return {
      title: 'Takip Edilenler',
      emptyMessage: 'Bu kullanıcı henüz kimseyi takip etmiyor',
      summaryLabel: (total) => `${total} takip`,
      listKey: `following:${params.userId}`,
    };
  }

  return {
    title: 'Beğenenler',
    emptyMessage: 'Henüz kimse bu gönderiyi beğenmemiş',
    summaryLabel: (total) => `${total} beğeni`,
    listKey: `route_likers:${params.routeId}`,
    initialTotalHint: params.likeCount,
  };
}

export const SocialUserListRouteScreen = ({
  navigation,
  route,
}: {
  navigation: any;
  route: { params?: unknown };
}) => {
  const styles = useThemedStyles((t) => ({
    invalidSafe: {
      flex: 1,
      backgroundColor: t.background,
    },
    invalidBody: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    invalidText: {
      fontSize: 15,
      color: t.textSecondary,
      textAlign: 'center',
    },
  }));

  const rawParams = route.params;

  let kind: SocialUserListRouteParams['kind'] | undefined;
  let userId: string | undefined;
  let routeId: string | undefined;
  let likeHint: number | undefined;

  if (isSocialUserListParams(rawParams)) {
    kind = rawParams.kind;

    if (rawParams.kind === 'followers' || rawParams.kind === 'following') {
      userId = rawParams.userId;
    } else {
      routeId = rawParams.routeId;
      likeHint = rawParams.likeCount;
    }
  }

  const resolved = useMemo(() => {
    if (kind === 'followers' && userId) {
      const params: SocialUserListRouteParams = {
        kind: 'followers',
        userId,
      };

      return {
        meta: metaForParams(params),
        fetchPage: createSocialUserListFetchPage(params),
      };
    }

    if (kind === 'following' && userId) {
      const params: SocialUserListRouteParams = {
        kind: 'following',
        userId,
      };

      return {
        meta: metaForParams(params),
        fetchPage: createSocialUserListFetchPage(params),
      };
    }

    if (kind === 'route_likers' && routeId) {
      const params: SocialUserListRouteParams = {
        kind: 'route_likers',
        routeId,
        likeCount: likeHint,
      };

      return {
        meta: metaForParams(params),
        fetchPage: createSocialUserListFetchPage(params),
      };
    }

    return null;
  }, [kind, userId, routeId, likeHint]);

  if (!resolved) {
    return (
      <SafeAreaView style={styles.invalidSafe} edges={['top', 'left', 'right']}>
        <SocialListHeader navigation={navigation} title="Liste" />
        <View style={styles.invalidBody}>
          <Text style={styles.invalidText}>Bu liste açılamadı.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { meta, fetchPage } = resolved;

  return (
    <SocialUserListScreen
      navigation={navigation}
      title={meta.title}
      emptyMessage={meta.emptyMessage}
      summaryLabel={meta.summaryLabel}
      fetchPage={fetchPage}
      listKey={meta.listKey}
      initialTotalHint={meta.initialTotalHint}
    />
  );
};

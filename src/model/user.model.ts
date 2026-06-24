import { triggerAchievementChecks } from '../lib/achievements';
import { supabase } from '../lib/supabase';
import NotificationModel from './notifications.model';

export interface User {
  id: string;
  username: string;
  full_name: string;
  image_url: string;
}

interface FollowResponse {
  success: boolean;
  message: string;
}

interface FollowType {
  follower_id: string;
  followed_id: string;
  followed_type: 'profile' | 'group' | 'event';
}

const unaccent = (text: string) => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const UserModel = {
  //* Get users by username
  async getUsers(searchQuery?: string, limit: number = 10) {
    const { data: users, error } = await supabase
    .rpc('search_profiles', { term: `%${searchQuery}%`, lim: limit });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return users as User[];
  },


  //* Get logged user
  async getLoggedUser() {
    const { data: user, error } = await supabase.auth.getUser();
    if (error) {throw error;}
    return user?.user;
  },

  // Function to get followers of a user
  async getFollowers(userId: string) {
    const { data: followers, error } = await supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(username)')
      .eq('followed_id', userId)
      .eq('followed_type', 'profile');

    if (error) {
      console.error('Error fetching followers:', error);
      throw error;
    }

    return followers;
  },

  // Function to get followers count of a user
  async getFollowersCount(userId: string) {
    const { count, error } = await supabase
      .from('follows')
      .select('follower_id', { count: 'exact' })
      .eq('followed_id', userId)
      .eq('followed_type', 'profile');

    if (error) {
      console.error('Error fetching followers count:', error);
      throw error;
    }

    return count;
  },

  // Function to get followings of a user
  async getFollowings(userId: string) {
    const { data: followings, error } = await supabase
      .from('follows')
      .select('followed_id, profiles!follows_followed_id_fkey(username)')
      .eq('follower_id', userId)
      .eq('followed_type', 'profile');

    if (error) {
      console.error('Error fetching followings:', error);
      throw error;
    }

    return followings;
  },

  // Function to get followings count of a user
  async getFollowingsCount(userId: string) {
    const { count, error } = await supabase
      .from('follows')
      .select('followed_id', { count: 'exact' })
      .eq('follower_id', userId)
      .eq('followed_type', 'profile');

    if (error) {
      console.error('Error fetching followings count:', error);
      throw error;
    }

    return count;
  },


  // Check if a user is following another user
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('followed_id', followingId)
      .eq('followed_type', 'profile')
      .maybeSingle();

    if (error) {
      console.error('Error checking follow status:', error);
      throw error;
    }

    return !!data;
  },

  /**
   * Görüntüleyen kullanıcının, verilen profil id'lerinden hangilerini takip ettiğini tek sorguda döner (N+1 yok).
   */
  async getFollowedIdsAmong(
    viewerId: string,
    candidateIds: string[],
  ): Promise<Set<string>> {
    const unique = [...new Set(candidateIds)].filter(Boolean);

    if (unique.length === 0) {
      return new Set();
    }

    const { data, error } = await supabase
      .from('follows')
      .select('followed_id')
      .eq('follower_id', viewerId)
      .eq('followed_type', 'profile')
      .in('followed_id', unique);

    if (error) {
      console.error('Error batch-checking follows:', error);
      throw error;
    }

    return new Set(
      (data || []).map((row: { followed_id: string }) => row.followed_id),
    );
  },

  // Follow a user
  async followUser(followerId: string, followingId: string): Promise<FollowResponse> {
    try {
      const isAlreadyFollowing = await this.isFollowing(followerId, followingId);

      if (isAlreadyFollowing) {
        return {
          success: false,
          message: 'Zaten takip ediyorsunuz',
        };
      }

      const data: FollowType = {
        follower_id: followerId,
        followed_id: followingId,
        followed_type: 'profile',
      };
      const { error } = await supabase
        .from('follows')
        .insert(data);

      if (error) {
        console.error('Error following user:', error);
        return {
          success: false,
          message: 'Takip edilirken bir hata oluştu',
        };
      }

      try {
        await NotificationModel.createNotification({
          senderId: followerId,
          recipientId: followingId,
          entityType: 'follow',
        });
      } catch (notificationError) {
        console.error('Error sending follow notification:', notificationError);
      }

      triggerAchievementChecks([followerId, followingId]);

      return {
        success: true,
        message: 'Kullanıcı takip edildi',
      };
    } catch (error) {
      console.error('Error following user:', error);
      return {
        success: false,
        message: 'Takip edilirken bir hata oluştu',
      };
    }
  },

  // Unfollow a user
  async unfollowUser(followerId: string, followingId: string): Promise<FollowResponse> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followed_id', followingId)
      .eq('followed_type', 'profile');

    if (error) {
      console.error('Error unfollowing user:', error);
      return {
        success: false,
        message: 'Takipten çıkarılırken bir hata oluştu',
      };
    }

    return {
      success: true,
      message: 'Takipten çıkarıldı',
    };
  },

  //* Check if a username is available
  async isUsernameAvailable(username: string): Promise<boolean> {
    const normalizedUsername = username.trim().toLowerCase();

    if (normalizedUsername.length === 0) {
      return false;
    }

    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .ilike('username', normalizedUsername);

    if (error) {
      console.error('Error checking username:', error);
      return false;
    }

    return (count || 0) === 0;
  },

  //* Update user profile images (avatar + header)
  async updateUserImage(
    userId: string,
    profile: Partial<{
      image_url: string;
      image_preview_url: string;
      header_image_url: string;
      header_image_preview_url: string;
    }>
  ): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }

    return true;
  },

};

// Example usage
// (async () => {
//   const userId = 'your-user-id-here'; // Replace with the actual user ID

//   try {
//     const followers = await UserModel.getFollowers(userId);
//     console.log('Followers:', followers);

//     const followings = await UserModel.getFollowings(userId);
//     console.log('Followings:', followings);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// })();

export default UserModel;
